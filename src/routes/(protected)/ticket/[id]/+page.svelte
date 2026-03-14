<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import type { Id } from '$convex/dataModel';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TicketStatusBadge from '$lib/components/ui/TicketStatusBadge.svelte';
	import NotFound from '$lib/components/ui/NotFound.svelte';
	import { TYPE_COLOR, TYPE_LABEL, PRIORITY_COLOR, PRIORITY_LABEL } from '$lib/constants/ticket';
	import type { TicketType, Priority } from '$lib/constants/ticket';
	import { formatDate } from '$lib/utils';

	const reportId = $derived(page.params.id as Id<'reports'>);
	const reportQuery = useQuery(api.reports.getById, () => ({ id: reportId }));
	const reporterQuery = useQuery(api.users.getById, () =>
		reportQuery.data ? { id: reportQuery.data.reporterId } : 'skip'
	);
	const meQuery = useQuery(api.users.currentUser, () => ({}));

	function parseAttachments(json: string | undefined): { name: string; url: string }[] {
		if (!json) return [];
		try {
			return JSON.parse(json);
		} catch {
			return [];
		}
	}

	const report = $derived(reportQuery.data);
	const reporterName = $derived(reporterQuery.data?.name ?? 'Tidak diketahui');
	const isOwner = $derived(!!meQuery.data && meQuery.data._id === report?.reporterId);
	const isBug = $derived(report?.type === 'bug');
	const ticketId = $derived(
		report?.ticketNumber ? `MI-${String(report.ticketNumber).padStart(3, '0')}` : '—'
	);
	const trelloDeleted = $derived(report?.trelloCardId && report?.trelloCardFound === false);
	const trelloArchived = $derived(report?.trelloCardId && report?.trelloArchived === true);
	const savedAttachments = $derived(parseAttachments(report?.attachmentUrls));
	const reportDate = $derived(report ? formatDate(report.createdAt) : '—');

	// Background Trello status fetch — fires after report loads, respects cooldown server-side
	$effect(() => {
		if (!report?.trelloCardId) return;
		fetch(`/api/trello-status/${report._id}`, { method: 'POST' }).catch(() => {});
	});
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Detail Tiket" backHref="/history" backLabel="Kembali ke Riwayat" />

	{#if reportQuery.isLoading}
		<div class="flex flex-col gap-3 pt-4">
			{#each [1, 2, 3, 4] as _, i (i)}
				<div class="h-10 animate-pulse rounded-xl bg-surface-2"></div>
			{/each}
		</div>
	{:else if report}
		<!-- Alert: Trello card deleted (404) -->
		{#if trelloDeleted}
			<div
				class="mb-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mt-0.5 shrink-0 text-danger"
				>
					<path
						d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
					/>
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				<p class="text-xs leading-relaxed text-danger">
					Card Trello untuk tiket ini telah dihapus. Data tiket tetap tersimpan di sini.
				</p>
			</div>
		{:else if trelloArchived}
			<!-- Alert: Trello card archived -->
			<div
				class="mb-4 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mt-0.5 shrink-0 text-warning"
				>
					<path d="M21 8v13H3V8" />
					<path d="M1 3h22v5H1z" />
					<line x1="10" y1="12" x2="14" y2="12" />
				</svg>
				<p class="text-xs leading-relaxed text-warning">
					Card Trello untuk tiket ini telah diarsipkan. Data tiket tetap tersimpan di sini.
				</p>
			</div>
		{/if}

		<!-- Alert: draft not yet sent to Trello — only visible to the creator -->
		{#if report.status === 'draft' && isOwner}
			<div
				class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
			>
				<div class="flex items-center gap-2.5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="shrink-0 text-warning"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<p class="text-xs text-warning">Tiket ini belum dikirim ke Trello.</p>
				</div>
				<Button href="/report/preview/{report._id}" size="sm">Kirim Sekarang</Button>
			</div>
		{/if}

		<!-- Header card -->
		<div class="mb-5 rounded-2xl border border-border bg-surface p-5">
			<!-- ID + badges -->
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<span class="font-mono text-xs font-semibold text-accent">{ticketId}</span>
				<span class="text-muted">·</span>
				<Badge color={TYPE_COLOR[report.type as TicketType]}
					>{TYPE_LABEL[report.type as TicketType]}</Badge
				>
				{#if report.priority}
					<Badge color={PRIORITY_COLOR[report.priority as Priority]}
						>{PRIORITY_LABEL[report.priority as Priority]}</Badge
					>
				{/if}

				<!-- Status badge (position-based coloring) -->
				<TicketStatusBadge
					trelloCardId={report.trelloCardId}
					trelloCardFound={report.trelloCardFound}
					trelloArchived={report.trelloArchived}
					trelloStatus={report.trelloStatus}
					trelloListIndex={report.trelloListIndex}
					trelloTotalLists={report.trelloTotalLists}
				/>
			</div>

			<!-- Title -->
			<h2 class="mb-4 text-base leading-snug font-semibold text-foreground">
				{report.title}
			</h2>

			<!-- Meta -->
			<div class="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
				<div class="flex items-center gap-1.5">
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
						<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
					{reporterName}
				</div>
				<div class="flex items-center gap-1.5">
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
					{reportDate}
				</div>
				{#if report.module}
					<div class="flex items-center gap-1.5">
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
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<line x1="3" y1="9" x2="21" y2="9" />
							<line x1="9" y1="21" x2="9" y2="3" />
						</svg>
						{report.module}
					</div>
				{/if}
			</div>
		</div>

		<!-- Trello link (hidden if card deleted or not yet sent) -->
		{#if report.trelloCardUrl && !trelloDeleted}
			<a
				href={report.trelloCardUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="mb-5 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:border-accent/30 hover:bg-surface-2"
			>
				<div class="flex items-center gap-2.5 text-sm text-foreground">
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
						class="text-accent"
					>
						<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
					Buka card di Trello
				</div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-muted"
				>
					<path d="M9 18l6-6-6-6" />
				</svg>
			</a>
		{/if}

		<!-- Fields -->
		<div class="flex flex-col gap-4">
			<!-- Deskripsi -->
			{#if report.description}
				<div class="rounded-xl border border-border bg-surface p-4">
					<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Deskripsi</p>
					<p class="text-sm leading-relaxed text-foreground">{report.description}</p>
				</div>
			{/if}

			<!-- Bug fields -->
			{#if isBug && (report.stepsToReproduce || report.expectedResult || report.actualResult || report.frequency)}
				<div class="rounded-xl border border-border bg-surface p-4">
					<div class="mb-3 flex items-center gap-2">
						<Badge color="red">Bug</Badge>
						<span class="text-xs text-muted">Detail teknis</span>
					</div>

					<div class="flex flex-col gap-4">
						{#if report.stepsToReproduce}
							<div>
								<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
									Steps to Reproduce
								</p>
								<pre
									class="font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground">{report.stepsToReproduce}</pre>
							</div>
						{/if}

						{#if report.expectedResult || report.actualResult}
							<div class="h-px bg-border"></div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{#if report.expectedResult}
									<div>
										<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
											Expected Behavior
										</p>
										<p class="text-sm leading-relaxed text-foreground">{report.expectedResult}</p>
									</div>
								{/if}
								{#if report.actualResult}
									<div>
										<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
											Actual Behavior
										</p>
										<p class="text-sm leading-relaxed text-danger/90">{report.actualResult}</p>
									</div>
								{/if}
							</div>
						{/if}

						{#if report.frequency}
							<div class="h-px bg-border"></div>
							<div>
								<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
									Frekuensi
								</p>
								<p class="text-sm text-foreground">{report.frequency}</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Dampak bisnis -->
			{#if report.businessImpact}
				<div class="rounded-xl border border-border bg-surface p-4">
					<p class="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
						Dampak Bisnis
					</p>
					<p class="text-sm leading-relaxed text-foreground">{report.businessImpact}</p>
				</div>
			{/if}

			<!-- Attachments from Trello -->
			{#if savedAttachments.length > 0}
				<div class="rounded-xl border border-border bg-surface p-4">
					<p class="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">
						Attachment ({savedAttachments.length})
					</p>
					<div class="flex flex-col gap-2">
						{#each savedAttachments as file (file.url)}
							<a
								href={file.url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 transition-colors hover:border-accent/30 hover:bg-surface"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="shrink-0 text-muted"
								>
									<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
									<polyline points="14 2 14 8 20 8" />
								</svg>
								<span class="min-w-0 flex-1 truncate text-xs text-foreground">{file.name}</span>
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
									class="shrink-0 text-muted"
								>
									<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Read-only notice — only shown after ticket is sent to Trello -->
			{#if report.status !== 'draft'}
				<div class="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mt-0.5 shrink-0 text-muted"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0110 0v4" />
					</svg>
					<p class="text-xs leading-relaxed text-muted">
						Tiket ini sudah dikirim dan tidak dapat diedit. Jika ada perubahan, silakan hubungi
						developer langsung melalui Whatsapp.
					</p>
				</div>
			{/if}
		</div>

		<div class="pb-8"></div>
	{:else}
		<NotFound
			title="Tiket tidak ditemukan"
			message="Tiket ini tidak ada atau kamu tidak punya akses."
			backHref="/history"
			backLabel="Kembali ke Riwayat"
		/>
	{/if}
</div>
