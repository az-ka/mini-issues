<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const report = $derived(data.report);

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';

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

	const ticketId = $derived(
		report.ticketNumber ? `MI-${String(report.ticketNumber).padStart(3, '0')}` : '—'
	);

	const reportDate = $derived(
		new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(report.createdAt))
	);
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	<div class="w-full max-w-sm">

		<!-- Icon -->
		<div class="mb-6 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-success"
				>
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			</div>
		</div>

		<!-- Title -->
		<div class="mb-6 text-center">
			<h1 class="text-xl font-bold text-foreground">Tiket berhasil dikirim!</h1>
			<p class="mt-1.5 text-sm text-muted">
				Tiketmu sudah masuk ke Trello dan siap dikerjakan oleh tim developer.
			</p>
		</div>

		<!-- Ticket summary -->
		<div class="mb-6 rounded-2xl border border-border bg-surface p-4">
			<p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Ringkasan Tiket</p>

			<div class="mb-2 flex flex-wrap items-center gap-2">
				<span class="font-mono text-xs font-semibold text-accent">{ticketId}</span>
				<span class="text-muted">·</span>
				<Badge color={typeColor[report.type as TicketType]}>{typeLabel[report.type as TicketType]}</Badge>
				{#if report.priority}
					<Badge color={priorityColor[report.priority as Priority]}>{priorityLabel[report.priority as Priority]}</Badge>
				{/if}
			</div>

			<p class="mb-3 text-sm font-medium leading-snug text-foreground">
				{report.title}
			</p>

			<div class="flex items-center gap-1.5 text-xs text-muted">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				Dikirim pada {reportDate}
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-3">
			<Button size="lg" class="w-full" href={`/ticket/${report._id}`}>
				Lihat Detail Tiket
			</Button>

			{#if report.trelloCardUrl}
				<Button variant="secondary" size="lg" class="w-full" href={report.trelloCardUrl} target="_blank" rel="noopener noreferrer">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
					Buka di Trello
				</Button>
			{/if}

			<Button variant="ghost" size="lg" class="w-full" href="/dashboard">
				Kembali ke Dashboard
			</Button>
		</div>

	</div>
</div>
