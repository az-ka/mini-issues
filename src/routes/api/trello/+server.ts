import { json, error } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_LIST_ID, GEMINI_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/api';
import type { RequestHandler } from './$types';
import type { Id } from '$convex/dataModel';

const TRELLO_BASE = 'https://api.trello.com/1';

// Lightweight/fast models preferred for board selection (single-token response)
const GEMINI_MODELS = [
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

	// Try Gemini (fast/cheap models)
	const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
	for (const model of GEMINI_MODELS) {
		try {
			const result = await ai.models.generateContent({ model, contents: prompt });
			const idx = parseInt((result.text ?? '').trim());
			if (!isNaN(idx) && idx >= 0 && idx < boards.length) {
				console.log(`[selectBoard] AI (${model}) → board ${idx}: "${boards[idx].name}"`);
				return boards[idx];
			}
		} catch (err) {
			const status = (err as { status?: number })?.status;
			if (status === 429 || status === 503) continue;
			break;
		}
	}

	// Groq fallback
	const groqKey = env.GROQ_API_KEY;
	if (groqKey) {
		try {
			const groq = new Groq({ apiKey: groqKey });
			const res = await groq.chat.completions.create({
				model: 'llama-3.1-8b-instant',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0,
				max_tokens: 5
			});
			const idx = parseInt((res.choices[0].message.content ?? '').trim());
			if (!isNaN(idx) && idx >= 0 && idx < boards.length) {
				console.log(`[selectBoard] Groq → board ${idx}: "${boards[idx].name}"`);
				return boards[idx];
			}
		} catch {
			/* fall through */
		}
	}

	console.warn('[selectBoard] AI failed, falling back to first active board');
	return boards[0];
}

export const POST: RequestHandler = async ({ request, locals }) => {
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
	const files = formData.getAll('attachments') as File[];

	if (!reportId || !title) error(400, 'reportId and title are required');

	// Build card description from all fields
	const fields: Record<string, unknown> = {};
	for (const [key, value] of formData.entries()) {
		if (key !== 'attachments' && typeof value === 'string') {
			fields[key] = value;
		}
	}

	// Step 1: Get auth token + Convex client (needed for board selection and saving)
	const token = await getToken({ template: 'convex' });
	if (!token) error(401, 'Gagal mendapatkan token autentikasi.');

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
	convex.setAuth(token);

	// Step 2: Fetch active boards and let AI pick the best one
	const activeBoards = (await convex.query(api.trelloBoards.listActive, {})) as ActiveBoard[];

	let selectedBoard: ActiveBoard | null = null;
	let listId = TRELLO_LIST_ID; // fallback to env var if no boards configured

	if (activeBoards.length > 0) {
		selectedBoard = await selectBoard(activeBoards, {
			type: fields.type as string,
			title,
			priority: fields.priority as string | undefined,
			module: fields.module as string | undefined,
			description: fields.description as string | undefined
		});
		listId = selectedBoard.listId;
	}

	// Step 3: Create Trello card
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

	return json({
		cardId: card.id,
		cardUrl: card.url,
		attachmentUrls
	});
};
