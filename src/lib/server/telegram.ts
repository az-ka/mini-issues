import { env } from '$env/dynamic/private';

const TELEGRAM_API = 'https://api.telegram.org';

// ── Label mappings ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
	bug: '🐛 Bug',
	feature: '✨ Fitur Baru',
	improvement: '⚡ Improvement'
};

const PRIORITY_LABELS: Record<string, string> = {
	low: '🟢 Rendah',
	medium: '🟡 Sedang',
	high: '🔴 Tinggi',
	critical: '🚨 Kritis'
};

// ── Types ───────────────────────────────────────────────────────────────────

export interface TelegramMessage {
	text: string;
	replyMarkup?: {
		inline_keyboard: { text: string; url: string }[][];
	};
}

// ── Core send ───────────────────────────────────────────────────────────────

export async function sendTelegramMessage(msg: TelegramMessage): Promise<void> {
	const token = env.TELEGRAM_BOT_TOKEN?.trim();
	const chatId = env.TELEGRAM_CHAT_ID?.trim();
	const threadId = env.TELEGRAM_THREAD_ID?.trim();

	if (!token || !chatId) {
		console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping.');
		return;
	}

	const body: Record<string, unknown> = {
		chat_id: chatId,
		text: msg.text,
		parse_mode: 'HTML',
		link_preview_options: { is_disabled: true }
	};
	if (threadId) body.message_thread_id = Number(threadId);
	if (msg.replyMarkup) body.reply_markup = msg.replyMarkup;

	const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const text = await res.text();
		console.error('[telegram] Failed to send message:', res.status, text);
	}
}

// ── Message builders ────────────────────────────────────────────────────────

export function buildNewTicketMessage(
	ticket: {
		ticketNumber?: number;
		title: string;
		type: string;
		priority?: string;
		module?: string;
		reporterName?: string;
		cardUrl?: string;
		reportId?: string;
	},
	appUrl?: string
): TelegramMessage {
	const typeLabel = TYPE_LABELS[ticket.type] ?? ticket.type;
	const priorityLabel = ticket.priority
		? (PRIORITY_LABELS[ticket.priority] ?? ticket.priority)
		: null;

	const fields: string[] = [];

	if (ticket.ticketNumber)
		fields.push(`No    : <code>MI-${String(ticket.ticketNumber).padStart(3, '0')}</code>`);
	fields.push(`Judul : ${e(ticket.title)}`);

	const tipeLine = [typeLabel, priorityLabel].filter(Boolean).join(' · ');
	fields.push(`Tipe  : ${tipeLine}`);

	if (ticket.module) fields.push(`Modul : ${e(ticket.module)}`);
	if (ticket.reporterName) fields.push(`Dari  : ${e(ticket.reporterName)}`);

	const header = `🎫 <b>MINI ISSUES</b> · Tiket Baru`;
	const separator = '─────────────────';
	const text = [header, separator, ...fields].join('\n');

	// Build inline keyboard buttons — Telegram only accepts HTTPS URLs
	const isHttps = (u: string) => u.startsWith('https://');
	const buttons: { text: string; url: string }[] = [];

	if (ticket.cardUrl && isHttps(ticket.cardUrl))
		buttons.push({ text: '↗ Buka Trello', url: ticket.cardUrl });

	if (appUrl && ticket.reportId) {
		const ticketUrl = `${appUrl}/ticket/${ticket.reportId}`;
		if (isHttps(ticketUrl)) buttons.push({ text: '↗ Buka Tiket', url: ticketUrl });
	}

	const replyMarkup = buttons.length > 0 ? { inline_keyboard: [buttons] } : undefined;

	return { text, replyMarkup };
}

// ── HTML escape ─────────────────────────────────────────────────────────────

function e(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
