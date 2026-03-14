<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../../../convex/_generated/api';
	import type { Id } from '../../../../../convex/_generated/dataModel';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import NotFound from '$lib/components/ui/NotFound.svelte';
	import { TYPE_COLOR, TYPE_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '$lib/constants/ticket';
	import type { TicketType, Priority } from '$lib/constants/ticket';
	import { formatDate } from '$lib/utils';

	const reportId = $derived(page.params.id as Id<'reports'>);
	const reportQuery = useQuery(api.reports.getById, () => ({ id: reportId }));

	const ticketId = $derived(
		reportQuery.data?.ticketNumber
			? `MI-${String(reportQuery.data.ticketNumber).padStart(3, '0')}`
			: '—'
	);

	const reportDate = $derived(reportQuery.data ? formatDate(reportQuery.data.createdAt) : '—');
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	{#if reportQuery.isLoading}
		<div class="w-full max-w-sm space-y-4">
			<div class="flex justify-center">
				<div class="h-16 w-16 animate-pulse rounded-full bg-surface-2"></div>
			</div>
			<div class="mx-auto h-6 w-3/4 animate-pulse rounded-lg bg-surface-2"></div>
			<div class="mx-auto h-4 w-1/2 animate-pulse rounded-lg bg-surface-2"></div>
			<div class="h-32 animate-pulse rounded-2xl bg-surface-2"></div>
			<div class="h-11 animate-pulse rounded-xl bg-surface-2"></div>
			<div class="h-11 animate-pulse rounded-xl bg-surface-2"></div>
		</div>
	{:else if reportQuery.data}
		{@const report = reportQuery.data}
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
					<Badge color={TYPE_COLOR[report.type as TicketType]}>{TYPE_LABEL[report.type as TicketType]}</Badge>
					{#if report.priority}
						<Badge color={PRIORITY_COLOR[report.priority as Priority]}>{PRIORITY_LABEL[report.priority as Priority]}</Badge>
					{/if}
				</div>

				<p class="mb-3 text-sm font-medium leading-snug text-foreground">{report.title}</p>

				<div class="flex items-center gap-1.5 text-xs text-muted">
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
	{:else}
		<NotFound
			title="Tiket tidak ditemukan"
			message="Tiket ini tidak ada atau kamu tidak punya akses."
		/>
	{/if}
</div>
