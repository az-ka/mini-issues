<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/api';
	import { relativeDate } from '$lib/utils';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TicketCard from '$lib/components/TicketCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { Search } from 'lucide-svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';

	const ticketsQuery = useQuery(api.reports.listAll, () => ({}));
	const allReports = $derived(ticketsQuery.data?.reports ?? []);
	const reachedLimit = $derived(ticketsQuery.data?.reachedLimit ?? false);

	let search = $state('');
	let filterType = $state<TicketType | 'all'>('all');
	let showMine = $state(false);

	const typeOptions: { value: TicketType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Semua' },
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'improvement', label: 'Improvement' }
	];

	const filtered = $derived(
		allReports.filter((t) => {
			const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
			const matchType = filterType === 'all' || t.type === filterType;
			const matchMine = !showMine || t.isOwn;
			return matchSearch && matchType && matchMine;
		})
	);

	const hasActiveFilter = $derived(search !== '' || filterType !== 'all' || showMine);

	function resetFilters() {
		search = '';
		filterType = 'all';
		showMine = false;
	}
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Riwayat Laporan" backHref="/dashboard" backLabel="Kembali ke Dashboard" />

	<!-- Search -->
	<div class="relative mb-4">
		<Search size={15} class="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
		<input
			type="text"
			bind:value={search}
			placeholder="Cari laporan berdasarkan judul..."
			class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pr-4 pl-10 text-sm text-foreground transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:outline-none"
		/>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex flex-wrap items-center gap-2">
		{#each typeOptions as opt (opt.value)}
			<button
				type="button"
				onclick={() => (filterType = opt.value)}
				class="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors {filterType ===
				opt.value
					? 'border-accent/40 bg-accent/10 text-accent'
					: 'border-border bg-surface text-muted hover:border-accent/20 hover:text-foreground'}"
			>
				{opt.label}
			</button>
		{/each}

		<div class="h-5 w-px self-center bg-border"></div>

		<!-- Laporan Saya toggle -->
		<button
			type="button"
			onclick={() => (showMine = !showMine)}
			class="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors {showMine
				? 'border-accent/40 bg-accent/10 text-accent'
				: 'border-border bg-surface text-muted hover:border-accent/20 hover:text-foreground'}"
		>
			Laporan Saya
		</button>
	</div>

	<!-- List -->
	{#if ticketsQuery.isLoading}
		<div class="flex flex-col gap-2">
			{#each [1, 2, 3, 4, 5] as _, i (i)}
				<div class="h-16 animate-pulse rounded-xl bg-surface-2"></div>
			{/each}
		</div>
	{:else if filtered.length === 0}
		{#if hasActiveFilter}
			<EmptyState
				icon="search"
				title="Tidak ada laporan yang cocok"
				message="Coba ubah kata kunci atau filter yang digunakan."
				actionLabel="Reset filter"
				onAction={resetFilters}
			/>
		{:else}
			<EmptyState
				icon="inbox"
				title="Belum ada laporan"
				message="Laporan yang dibuat akan muncul di sini."
				actionLabel="Buat laporan baru"
				actionHref="/report/chat"
			/>
		{/if}
	{:else}
		<p class="mb-3 text-xs text-muted">{filtered.length} laporan ditemukan</p>
		<div class="flex flex-col gap-2">
			{#each filtered as ticket (ticket._id)}
				<TicketCard
					id={ticket._id}
					title={ticket.title}
					type={ticket.type as TicketType}
					priority={(ticket.priority ?? 'low') as 'high' | 'medium' | 'low'}
					date={relativeDate(ticket.createdAt)}
					reporterName={ticket.reporterName}
					trelloCardId={ticket.trelloCardId}
					trelloCardFound={ticket.trelloCardFound}
					trelloArchived={ticket.trelloArchived}
					trelloStatus={ticket.trelloStatus}
					trelloListIndex={ticket.trelloListIndex}
					trelloTotalLists={ticket.trelloTotalLists}
				/>
			{/each}
		</div>

		{#if reachedLimit}
			<p class="mt-4 text-center text-xs text-muted/50">Menampilkan 200 laporan terbaru</p>
		{/if}
	{/if}
</div>
