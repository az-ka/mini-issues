import { json, error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_LIST_ID } from '$env/static/private';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/api';
import type { RequestHandler } from './$types';
import type { Id } from '$convex/dataModel';

const TRELLO_BASE = 'https://api.trello.com/1';

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

	// Step 1: Create Trello card
	const cardRes = await fetch(
		`${TRELLO_BASE}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify({
				idList: TRELLO_LIST_ID,
				name: title,
				desc: buildCardDescription(fields)
			})
		}
	);

	if (!cardRes.ok) {
		const msg = await cardRes.text();
		console.error('[/api/trello] Create card failed:', msg);
		error(502, 'Gagal membuat card di Trello.');
	}

	const card = await cardRes.json() as { id: string; url: string };

	// Step 2: Upload attachments (sequential to avoid rate limits)
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
			const attachment = await attachRes.json() as { name: string; url: string };
			attachmentUrls.push({ name: attachment.name, url: attachment.url });
		} else {
			console.warn(`[/api/trello] Failed to upload attachment: ${file.name}`);
		}
	}

	// Step 3: Mark report as sent in Convex
	const token = await getToken({ template: 'convex' });
	if (token) {
		const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
		convex.setAuth(token);

		await convex.mutation(api.reports.markSentToTrello, {
			id: reportId as Id<'reports'>,
			trelloCardId: card.id,
			trelloCardUrl: card.url,
			attachmentUrls: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : undefined
		});
	}

	return json({
		cardId: card.id,
		cardUrl: card.url,
		attachmentUrls
	});
};
