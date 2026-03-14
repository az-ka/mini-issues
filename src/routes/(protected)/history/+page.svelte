<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TicketCard from '$lib/components/TicketCard.svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';

	interface Ticket {
		id: string;
		title: string;
		type: TicketType;
		priority: Priority;
		status: string;
		date: string;
	}

	const allTickets: Ticket[] = [
		{
			id: '1',
			title: 'Tombol login tidak merespon setelah salah password 3 kali',
			type: 'bug',
			priority: 'high',
			status: 'Sedang Dikerjakan',
			date: '2 jam lalu'
		},
		{
			id: '2',
			title: 'Tambahkan fitur export laporan ke PDF',
			type: 'feature',
			priority: 'medium',
			status: 'Menunggu Review',
			date: '1 hari lalu'
		},
		{
			id: '3',
			title: 'Tampilan tabel di halaman laporan tidak rapi di layar kecil',
			type: 'improvement',
			priority: 'low',
			status: 'Menunggu Review',
			date: '3 hari lalu'
		},
		{
			id: '4',
			title: 'Data transaksi tidak tersimpan saat koneksi terputus',
			type: 'bug',
			priority: 'high',
			status: 'Selesai',
			date: '5 hari lalu'
		},
		{
			id: '5',
			title: 'Notifikasi email tidak terkirim setelah submit form',
			type: 'bug',
			priority: 'medium',
			status: 'Dalam Review',
			date: '1 minggu lalu'
		},
		{
			id: '6',
			title: 'Tambahkan filter tanggal di halaman riwayat transaksi',
			type: 'feature',
			priority: 'medium',
			status: 'Selesai',
			date: '2 minggu lalu'
		},
		{
			id: '7',
			title: 'Warna tombol utama kurang kontras di mode terang',
			type: 'improvement',
			priority: 'low',
			status: 'Ditolak',
			date: '3 minggu lalu'
		}
	];

	let search = $state('');
	let filterType = $state<TicketType | 'all'>('all');
	let filterStatus = $state('all');

	const statusOptions = ['all', 'Menunggu Review', 'Sedang Dikerjakan', 'Dalam Review', 'Selesai', 'Ditolak'];

	const typeOptions: { value: TicketType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Semua Tipe' },
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature' },
		{ value: 'improvement', label: 'Improvement' }
	];

	const filteredTickets = $derived(
		allTickets.filter((t) => {
			const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
			const matchType = filterType === 'all' || t.type === filterType;
			const matchStatus = filterStatus === 'all' || t.status === filterStatus;
			return matchSearch && matchType && matchStatus;
		})
	);
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Riwayat Tiket" backHref="/dashboard" backLabel="Kembali ke Dashboard" />

	<!-- Search -->
	<div class="relative mb-4">
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
			class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			type="text"
			bind:value={search}
			placeholder="Cari tiket berdasarkan judul..."
			class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
		/>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex flex-wrap gap-2">
		<!-- Type filter -->
		{#each typeOptions as opt}
			<button
				type="button"
				onclick={() => (filterType = opt.value)}
				class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {filterType === opt.value
					? 'border-accent/40 bg-accent/10 text-accent'
					: 'border-border bg-surface text-muted hover:border-accent/20 hover:text-foreground'}"
			>
				{opt.label}
			</button>
		{/each}

		<div class="h-5 w-px self-center bg-border"></div>

		<!-- Status filter -->
		{#each statusOptions as status}
			<button
				type="button"
				onclick={() => (filterStatus = status)}
				class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {filterStatus === status
					? 'border-accent/40 bg-accent/10 text-accent'
					: 'border-border bg-surface text-muted hover:border-accent/20 hover:text-foreground'}"
			>
				{status === 'all' ? 'Semua Status' : status}
			</button>
		{/each}
	</div>

	<!-- Results count -->
	<p class="mb-3 text-xs text-muted">
		{filteredTickets.length} tiket ditemukan
	</p>

	<!-- Ticket list -->
	{#if filteredTickets.length === 0}
		<div class="rounded-xl border border-border bg-surface py-16 text-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mx-auto mb-3 text-muted/50"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<p class="text-sm text-muted">Tidak ada tiket yang cocok.</p>
			<button
				type="button"
				onclick={() => { search = ''; filterType = 'all'; filterStatus = 'all'; }}
				class="mt-2 text-xs text-accent hover:underline"
			>
				Reset filter
			</button>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each filteredTickets as ticket (ticket.id)}
				<TicketCard
					id={ticket.id}
					title={ticket.title}
					type={ticket.type}
					priority={ticket.priority}
					date={ticket.date}
				/>
			{/each}
		</div>
	{/if}
</div>
