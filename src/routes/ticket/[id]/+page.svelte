<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';

	const mockTicket = {
		id: 'MI-001',
		title: 'Tombol login tidak merespon setelah salah password 3 kali',
		type: 'bug' as TicketType,
		priority: 'high' as Priority,
		status: 'Sedang Dikerjakan',
		module: 'Halaman Login / Autentikasi',
		description:
			'Setelah pengguna memasukkan password yang salah sebanyak 3 kali berturut-turut, tombol "Masuk" berubah menjadi abu-abu dan tidak bisa diklik. Kondisi ini bertahan bahkan setelah halaman di-refresh, dan hanya hilang jika pengguna menutup tab dan membuka halaman baru.',
		steps:
			'1. Buka halaman login\n2. Masukkan email yang valid\n3. Masukkan password yang salah sebanyak 3 kali\n4. Perhatikan tombol "Masuk" berubah menjadi tidak aktif\n5. Coba refresh halaman — tombol tetap tidak aktif',
		expected:
			'Tombol login tetap aktif dan pengguna dapat mencoba login kembali, atau muncul pesan error yang jelas dengan opsi reset password.',
		actual:
			'Tombol login menjadi abu-abu dan tidak dapat diklik. Harus menutup tab untuk bisa login kembali.',
		frequency: 'Selalu terjadi',
		impact:
			'Cukup menghambat — pengguna tidak bisa akses sistem sama sekali sampai menutup dan membuka tab baru, terutama bermasalah saat deadline input data.',
		reporter: 'Rina Wulandari',
		reporterEmail: 'rina@perusahaan.com',
		date: '17 Juli 2025, 14:32',
		trelloUrl: 'https://trello.com/c/example',
		attachments: [
			{ name: 'screenshot-login-error.png', size: '1.2 MB' },
			{ name: 'screen-recording.mp4', size: '4.8 MB' }
		]
	};

	const isBug = $derived(mockTicket.type === 'bug');

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

	const statusColor: Record<string, string> = {
		'Menunggu Review': 'bg-muted/10 text-muted border-muted/20',
		'Sedang Dikerjakan': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
		'Dalam Review': 'bg-warning/10 text-warning border-warning/20',
		Selesai: 'bg-success/10 text-success border-success/20',
		Ditolak: 'bg-danger/10 text-danger border-danger/20'
	};
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Detail Tiket" backHref="/history" backLabel="Kembali ke Riwayat" />

	<!-- Header card -->
	<div class="mb-5 rounded-2xl border border-border bg-surface p-5">
		<!-- ID + badges -->
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<span class="font-mono text-xs font-semibold text-accent">{mockTicket.id}</span>
			<span class="text-muted">·</span>
			<Badge color={typeColor[mockTicket.type]}>{typeLabel[mockTicket.type]}</Badge>
			<Badge color={priorityColor[mockTicket.priority]}>{priorityLabel[mockTicket.priority]}</Badge>

			<!-- Status badge -->
			<span
				class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium {statusColor[mockTicket.status] ?? 'bg-surface-2 text-muted border-border'}"
			>
				{mockTicket.status}
			</span>
		</div>

		<!-- Title -->
		<h2 class="mb-4 text-base font-semibold leading-snug text-foreground">
			{mockTicket.title}
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
				{mockTicket.reporter}
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
				{mockTicket.date}
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
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<line x1="3" y1="9" x2="21" y2="9" />
					<line x1="9" y1="21" x2="9" y2="3" />
				</svg>
				{mockTicket.module}
			</div>
		</div>
	</div>

	<!-- Trello link -->
	<a
		href={mockTicket.trelloUrl}
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

	<!-- Fields -->
	<div class="flex flex-col gap-4">
		<!-- Deskripsi -->
		<div class="rounded-xl border border-border bg-surface p-4">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Deskripsi</p>
			<p class="text-sm leading-relaxed text-foreground">{mockTicket.description}</p>
		</div>

		<!-- Bug fields -->
		{#if isBug}
			<div class="rounded-xl border border-border bg-surface p-4">
				<div class="mb-3 flex items-center gap-2">
					<Badge color="red">Bug</Badge>
					<span class="text-xs text-muted">Detail teknis</span>
				</div>

				<div class="flex flex-col gap-4">
					<!-- Steps -->
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
							Steps to Reproduce
						</p>
						<pre
							class="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans"
						>{mockTicket.steps}</pre>
					</div>

					<div class="h-px bg-border"></div>

					<!-- Expected vs Actual -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
								Expected Behavior
							</p>
							<p class="text-sm leading-relaxed text-foreground">{mockTicket.expected}</p>
						</div>
						<div>
							<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
								Actual Behavior
							</p>
							<p class="text-sm leading-relaxed text-danger/90">{mockTicket.actual}</p>
						</div>
					</div>

					<div class="h-px bg-border"></div>

					<!-- Frequency -->
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Frekuensi</p>
						<p class="text-sm text-foreground">{mockTicket.frequency}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Dampak bisnis -->
		<div class="rounded-xl border border-border bg-surface p-4">
			<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Dampak Bisnis</p>
			<p class="text-sm leading-relaxed text-foreground">{mockTicket.impact}</p>
		</div>

		<!-- Attachments -->
		{#if mockTicket.attachments.length > 0}
			<div class="rounded-xl border border-border bg-surface p-4">
				<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
					Attachment ({mockTicket.attachments.length})
				</p>
				<div class="flex flex-col gap-2">
					{#each mockTicket.attachments as file}
						<div
							class="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
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
							<span class="shrink-0 text-xs text-muted">{file.size}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Read-only notice -->
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
				Tiket ini sudah dikirim dan tidak dapat diedit. Jika ada perubahan, silakan hubungi developer
				langsung melalui Trello.
			</p>
		</div>
	</div>

	<div class="pb-8"></div>
</div>
