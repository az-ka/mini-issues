import { env } from '$env/dynamic/private';

const TELEGRAM_API = 'https://api.telegram.org';

export async function sendTelegramMessage(text: string): Promise<void> {
	const token = env.TELEGRAM_BOT_TOKEN?.trim();
	const chatId = env.TELEGRAM_CHAT_ID?.trim();

	if (!token || !chatId) {
		console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping.');
		return;
	}

	const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'Markdown',
			disable_web_page_preview: true
		})
	});

	if (!res.ok) {
		const body = await res.text();
		console.error('[telegram] Failed to send message:', res.status, body);
	}
}

export function buildNewTicketMessage(ticket: {
	ticketNumber?: number;
	title: string;
	type: string;
	priority?: string;
	module?: string;
	reporterName?: string;
	boardLabel?: string;
	cardUrl?: string;
}): string {
	const lines: string[] = [];

	lines.push(`🎫 *Tiket Baru*`);
	lines.push('');

	if (ticket.ticketNumber) lines.push(`🔢 *No:* MI\\-${ticket.ticketNumber}`);
	lines.push(`📌 *Judul:* ${escapeMarkdown(ticket.title)}`);

	const typeLabel: Record<string, string> = {
		bug: '🐛 Bug',
		feature: '✨ Feature Request',
		improvement: '⚡ Improvement'
	};
	lines.push(`🏷️ *Tipe:* ${typeLabel[ticket.type] ?? ticket.type}`);

	if (ticket.priority) lines.push(`🔴 *Prioritas:* ${ticket.priority}`);
	if (ticket.module) lines.push(`📦 *Modul:* ${escapeMarkdown(ticket.module)}`);
	if (ticket.boardLabel) lines.push(`📋 *Board:* ${escapeMarkdown(ticket.boardLabel)}`);
	if (ticket.reporterName) lines.push(`👤 *Dari:* ${escapeMarkdown(ticket.reporterName)}`);
	if (ticket.cardUrl) lines.push(`🔗 [Lihat di Trello](${ticket.cardUrl})`);

	return lines.join('\n');
}

// Escape special Markdown characters for Telegram
function escapeMarkdown(text: string): string {
	return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
