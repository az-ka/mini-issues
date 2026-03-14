<script lang="ts">
	interface Props {
		trelloCardId?: string;
		trelloCardFound?: boolean;
		trelloArchived?: boolean;
		trelloStatus?: string; // Actual list name from Trello
		trelloListIndex?: number; // 0-based, sorted by pos (left = 0)
		trelloTotalLists?: number;
	}

	let {
		trelloCardId,
		trelloCardFound,
		trelloArchived,
		trelloStatus,
		trelloListIndex,
		trelloTotalLists
	}: Props = $props();

	type BadgeStyle = { label: string; color: string };

	function computeBadge(): BadgeStyle {
		// Not yet sent to Trello
		if (!trelloCardId) {
			return { label: 'Draft', color: 'bg-muted/10 text-muted border-muted/20' };
		}

		// Card was deleted from Trello (404)
		if (trelloCardFound === false) {
			return { label: 'Dihapus', color: 'bg-danger/10 text-danger border-danger/20' };
		}

		// Card is archived in Trello (closed: true)
		if (trelloArchived) {
			return { label: 'Diarsipkan', color: 'bg-warning/10 text-warning border-warning/20' };
		}

		const label = trelloStatus ?? '—';

		// No position data yet (fetching or failed)
		if (trelloListIndex === undefined || trelloTotalLists === undefined || trelloTotalLists === 0) {
			return { label, color: 'bg-surface-2 text-muted border-border' };
		}

		const last = trelloTotalLists - 1;

		// Last list = done (green)
		if (trelloListIndex === last) {
			return { label, color: 'bg-success/10 text-success border-success/20' };
		}

		// First list = backlog/todo (gray)
		if (trelloListIndex === 0) {
			return { label, color: 'bg-surface-2 text-muted border-border' };
		}

		// Second-to-last (review/QA) = yellow — only if board has >3 lists
		if (trelloTotalLists > 3 && trelloListIndex === last - 1) {
			return { label, color: 'bg-warning/10 text-warning border-warning/20' };
		}

		// Middle lists = in progress (blue)
		return { label, color: 'bg-blue-400/10 text-blue-400 border-blue-400/20' };
	}

	const badge = $derived(computeBadge());
</script>

<span
	class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium {badge.color}"
>
	{badge.label}
</span>
