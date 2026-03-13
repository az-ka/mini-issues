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
