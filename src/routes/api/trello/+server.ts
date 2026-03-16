import { json, error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { generateText } from '$lib/server/ai';
import { sendTelegramMessage, buildNewTicketMessage } from '$lib/server/telegram';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/api';
import type { RequestHandler } from './$types';
import type { Id } from '$convex/dataModel';

const TRELLO_BASE = 'https://api.trello.com/1';

// Lightweight/fast models preferred for board selection (single-token response)
const SELECT_BOARD_MODELS = [
	'gemini-2.5-flash-lite',
	'gemini-3.1-flash-lite',
	'gemma-3-4b-it',
	'gemma-3-1b-it'
] as const;

function buildCardDescription(body: Record<string, unknown>): string {
	const lines: string[] = [];

	if (body.type) lines.push(`**Tipe:** ${body.type}`);
	if (body.priority) lines.push(`**Prioritas:** ${body.priority}`);
	if (body.module) lines.push(`**Modul:** ${body.module}`);
	if (body.description) lines.push(`\n**Deskripsi:**\n${body.description}`);
	if (body.stepsToReproduce) lines.push(`\n**Steps to Reproduce:**\n${body.stepsToReproduce}`);
	if (body.expectedResult) lines.push(`\n**Expected:** ${body.expectedResult}`);
	if (body.actualResult) lines.push(`\n**Actual:** ${body.actualResult}`);
	if (body.frequency) lines.push(`**Frekuensi:** ${body.frequency}`);
	if (body.businessImpact) lines.push(`\n**Dampak Bisnis:**\n${body.businessImpact}`);
	if (body.reporterName) lines.push(`\n---\n*Dilaporkan oleh: ${body.reporterName}*`);

	return lines.join('\n');
}

type ActiveBoard = {
	_id: string;
	name: string;
	boardId: string;
	boardName?: string;
	listId: string;
	listName?: string;
	workspaceName?: string;
};

async function selectBoard(
	boards: ActiveBoard[],
	ticket: {
		type: string;
		title: string;
		priority?: string;
		module?: string;
		description?: string;
	}
): Promise<ActiveBoard> {
	if (boards.length <= 1) return boards[0];

	const boardList = boards
		.map((b, i) => {
			const detail = [b.boardName, b.listName].filter(Boolean).join(' → ');
			return `${i}. "${b.name}"${detail ? ` (${detail})` : ''}`;
		})
		.join('\n');

	const prompt = `You are a ticket routing system. Select the most appropriate Trello board for this ticket.

Ticket:
- Type: ${ticket.type}
- Title: ${ticket.title}${ticket.priority ? `\n- Priority: ${ticket.priority}` : ''}${ticket.module ? `\n- Module: ${ticket.module}` : ''}${ticket.description ? `\n- Description: ${ticket.description.slice(0, 300)}` : ''}

Available boards:
${boardList}

Respond with ONLY the index number (0 to ${boards.length - 1}) of the best matching board. No explanation, just the number.`;

	try {
		const text = await generateText(prompt, SELECT_BOARD_MODELS, {
			temperature: 0,
			maxOutputTokens: 5
		});
		const idx = parseInt(text.trim());
		if (!isNaN(idx) && idx >= 0 && idx < boards.length) {
			console.log(`[selectBoard] AI → board ${idx}: "${boards[idx].name}"`);
			return boards[idx];
		}
	} catch (err) {
		console.warn('[selectBoard] AI failed, falling back to first active board:', err);
	}

	return boards[0];
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const { userId, getToken } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

	// Parse multipart form data (fields + files)
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		error(400, 'Invalid form data');
	}

	const reportId = formData.get('reportId') as string;
	const title = formData.get('title') as string;
	const manualBoardId = formData.get('boardId') as string | null;
	const files = formData.getAll('attachments') as File[];

	if (!reportId || !title) error(400, 'reportId and title are required');

	// Build card description from all fields
	const fields: Record<string, unknown> = {};
	for (const [key, value] of formData.entries()) {
		if (key !== 'attachments' && typeof value === 'string') {
			fields[key] = value;
		}
	}

	// Step 1: Get auth token + Convex client
	console.log('[/api/trello] Step 1: getting Convex token...');
	const token = await getToken({ template: 'convex' });
	if (!token) {
		console.error('[/api/trello] Step 1: token not available');
		error(401, 'Gagal mendapatkan token autentikasi.');
	}
	console.log('[/api/trello] Step 1: OK');

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
	convex.setAuth(token);

	// Step 2: Fetch active boards and let AI pick the best one
	console.log('[/api/trello] Step 2: fetching active boards...');
	let activeBoards: ActiveBoard[] = [];
	try {
		activeBoards = (await convex.query(api.trelloBoards.listActive, {})) as ActiveBoard[];
		console.log(`[/api/trello] Step 2: ${activeBoards.length} active board(s) found`);
	} catch (err) {
		console.error('[/api/trello] Step 2: failed to fetch boards from Convex:', err);
		// Non-fatal — continue, will use TRELLO_LIST_ID env fallback
	}

	let selectedBoard: ActiveBoard | null = null;
	let listId = env.TRELLO_LIST_ID ?? '';

	if (activeBoards.length > 0) {
		if (manualBoardId) {
			// Manual form — skip AI, use the user-selected board
			selectedBoard = activeBoards.find((b) => b._id === manualBoardId) ?? activeBoards[0];
			listId = selectedBoard.listId;
			console.log(
				`[/api/trello] Step 2: manual board → "${selectedBoard.name}" → listId ${listId}`
			);
		} else {
			// AI chat flow — let AI pick the best board
			selectedBoard = await selectBoard(activeBoards, {
				type: fields.type as string,
				title,
				priority: fields.priority as string | undefined,
				module: fields.module as string | undefined,
				description: fields.description as string | undefined
			});
			listId = selectedBoard.listId;
			console.log(
				`[/api/trello] Step 2: AI selected board "${selectedBoard.name}" → listId ${listId}`
			);
		}
	} else {
		console.warn('[/api/trello] Step 2: no active boards, using TRELLO_LIST_ID fallback');
	}

	if (!listId) {
		console.error(
			'[/api/trello] Step 2: no listId available — configure a board in admin or set TRELLO_LIST_ID'
		);
		error(400, 'Tidak ada board Trello yang aktif. Silakan tambahkan board di halaman admin.');
	}

	// Step 3: Create Trello card
	console.log(`[/api/trello] Step 3: creating card in list ${listId}...`);
	const cardRes = await fetch(`${TRELLO_BASE}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			idList: listId,
			name: title,
			desc: buildCardDescription(fields)
		})
	});

	if (!cardRes.ok) {
		const msg = await cardRes.text();
		console.error('[/api/trello] Create card failed:', msg);
		error(502, 'Gagal membuat card di Trello.');
	}

	const card = (await cardRes.json()) as { id: string; url: string };

	// Step 4: Upload attachments (sequential to avoid rate limits)
	const attachmentUrls: { name: string; url: string }[] = [];

	for (const file of files) {
		const attachForm = new FormData();
		attachForm.append('file', file, file.name);
		attachForm.append('name', file.name);
		attachForm.append('mimeType', file.type);

		const attachRes = await fetch(
			`${TRELLO_BASE}/cards/${card.id}/attachments?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
			{ method: 'POST', body: attachForm }
		);

		if (attachRes.ok) {
			const attachment = (await attachRes.json()) as { name: string; url: string };
			attachmentUrls.push({ name: attachment.name, url: attachment.url });
		} else {
			console.warn(`[/api/trello] Failed to upload attachment: ${file.name}`);
		}
	}

	// Step 5: Mark report as sent in Convex (with selected board snapshot)
	await convex.mutation(api.reports.markSentToTrello, {
		id: reportId as Id<'reports'>,
		trelloCardId: card.id,
		trelloCardUrl: card.url,
		attachmentUrls: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : undefined,
		trelloBoardLabel: selectedBoard?.name,
		trelloBoardName: selectedBoard?.boardName,
		trelloListName: selectedBoard?.listName
	});

	// Step 6: Send Telegram notification (non-blocking, fire-and-forget)
	(async () => {
		try {
			const notifSettings = await convex.query(api.settings.get, {});
			if (notifSettings?.notifyOnNew) {
				const report = await convex.query(api.reports.getById, {
					id: reportId as Id<'reports'>
				});
				const msg = buildNewTicketMessage(
					{
						ticketNumber: report?.ticketNumber,
						title,
						type: (fields.type as string) ?? '',
						priority: fields.priority as string | undefined,
						module: fields.module as string | undefined,
						reporterName: fields.reporterName as string | undefined,
						cardUrl: card.url,
						reportId
					},
					url.origin
				);
				await sendTelegramMessage(msg);
				console.log('[/api/trello] Step 6: Telegram notification sent');
			}
		} catch (err) {
			console.error('[/api/trello] Step 6: Telegram notification failed (non-fatal):', err);
		}
	})();

	return json({
		cardId: card.id,
		cardUrl: card.url,
		attachmentUrls
	});
};
