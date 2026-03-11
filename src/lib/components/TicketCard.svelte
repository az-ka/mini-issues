<script lang="ts">
	import Badge from './ui/Badge.svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';

	interface Props {
		id: string;
		title: string;
		type: TicketType;
		priority: Priority;
		status: string;
		date: string;
		href?: string;
	}

	let { id, title, type, priority, status, date, href = `/ticket/${id}` }: Props = $props();

	const typeColor: Record<TicketType, 'red' | 'blue' | 'green'> = {
		bug: 'red',
		feature: 'blue',
		improvement: 'green'
	};

	const typeLabel: Record<TicketType, string> = {
		bug: 'Bug',
		feature: 'Feature',
		improvement: 'Improvement'
	};

	const priorityColor: Record<Priority, 'red' | 'yellow' | 'green'> = {
		high: 'red',
		medium: 'yellow',
		low: 'green'
	};

	const priorityLabel: Record<Priority, string> = {
		high: 'High',
		medium: 'Medium',
		low: 'Low'
	};
</script>

<a
	{href}
	class="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:bg-surface-2"
>
	<div class="min-w-0 flex-1">
		<p
			class="mb-2 truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent"
		>
			{title}
		</p>
		<div class="flex flex-wrap items-center gap-1.5">
			<Badge color={typeColor[type]}>{typeLabel[type]}</Badge>
			<Badge color={priorityColor[priority]}>{priorityLabel[priority]}</Badge>
			<span class="text-xs text-muted">{status}</span>
			<span class="text-xs text-muted">·</span>
			<span class="text-xs text-muted">{date}</span>
		</div>
	</div>

	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="shrink-0 text-border transition-colors group-hover:text-muted"
	>
		<path d="M9 18l6-6-6-6" />
	</svg>
</a>
