import { ConvexError } from 'convex/values';

/**
 * Extracts a human-readable error message from a Convex or generic error.
 */
export function extractError(err: unknown, fallback: string): string {
	if (err instanceof ConvexError) {
		return typeof err.data === 'string' ? err.data : fallback;
	}
	return err instanceof Error ? err.message : fallback;
}

/**
 * Returns up to 2 uppercase initials from a name.
 * "Azka" → "A", "Az Ka" → "AK", "Az Ka Dio" → "AK"
 */
export function getInitials(name: string | null | undefined): string {
	if (!name) return '?';
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join('');
}

/**
 * Returns a human-readable relative date string.
 * e.g. "Baru saja", "5 menit lalu", "2 jam lalu", "3 hari lalu"
 */
export function relativeDate(epochMs: number): string {
	const diff = Date.now() - epochMs;
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return 'Baru saja';
	if (mins < 60) return `${mins} menit lalu`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} jam lalu`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days} hari lalu`;
	const months = Math.floor(days / 30);
	return `${months} bulan lalu`;
}

/**
 * Formats an epoch ms timestamp to a full Indonesian date+time string.
 * e.g. "14 Maret 2026, 10.30"
 */
export function formatDate(epochMs: number): string {
	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(epochMs));
}
