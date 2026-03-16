import { json, error } from '@sveltejs/kit';
import { sendTelegramMessage, buildNewTicketMessage } from '$lib/server/telegram';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const { userId } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

	const msg = buildNewTicketMessage(
		{
			ticketNumber: 11,
			title: '[TEST] Cek notifikasi Telegram',
			type: 'bug',
			priority: 'medium',
			module: 'Halaman Admin',
			reporterName: 'Admin',
			cardUrl: 'https://trello.com',
			reportId: 'test'
		},
		url.origin
	);

	try {
		await sendTelegramMessage(msg);
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Gagal mengirim pesan Telegram.';
		return json({ ok: false, message }, { status: 500 });
	}
};
