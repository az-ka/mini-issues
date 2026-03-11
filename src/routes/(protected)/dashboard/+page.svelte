<script lang="ts">
	import { goto } from '$app/navigation';
	import { useClerkContext } from 'svelte-clerk/client';
	import Button from '$lib/components/ui/Button.svelte';
	import TicketCard from '$lib/components/TicketCard.svelte';

	const ctx = useClerkContext();

	const user = $derived(ctx.user);
	const displayName = $derived(user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'Kamu');
	const initials = $derived(displayName.charAt(0).toUpperCase());
	const avatarUrl = $derived(user?.imageUrl);
	const userEmail = $derived(user?.primaryEmailAddress?.emailAddress ?? '');

	let dropdownOpen = $state(false);

	async function handleSignOut() {
		const clerk = ctx.clerk;
		if (!clerk) return;
		await clerk.signOut();
		goto('/');
	}

	const mockTickets = [
		{
			id: '1',
			title: 'Tombol login tidak merespon setelah salah password 3 kali',
			type: 'bug' as const,
			priority: 'high' as const,
			status: 'Sedang Dikerjakan',
			date: '2 jam lalu'
		},
		{
			id: '2',
			title: 'Tambahkan fitur export laporan ke PDF',
			type: 'feature' as const,
			priority: 'medium' as const,
			status: 'Menunggu Review',
			date: '1 hari lalu'
		},
		{
			id: '3',
			title: 'Tampilan tabel di halaman laporan tidak rapi di mobile',
			type: 'improvement' as const,
			priority: 'low' as const,
			status: 'Menunggu Review',
			date: '3 hari lalu'
		}
	];
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<!-- Top bar -->
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-2.5">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/20 bg-accent/10"
			>
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
					class="text-accent"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
			</div>
			<span class="text-sm font-semibold text-foreground">Mini Issues</span>
		</div>

		<!-- User info + dropdown -->
		<div class="relative">
			{#if user !== undefined}
				<button
					type="button"
					onclick={() => (dropdownOpen = !dropdownOpen)}
					class="flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-surface-2 cursor-pointer"
				>
					<span class="text-sm text-muted">Halo, {displayName}</span>
					{#if avatarUrl}
						<img
							src={avatarUrl}
							alt={displayName}
							class="h-8 w-8 rounded-full object-cover ring-1 ring-border"
						/>
					{:else}
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent"
						>
							{initials}
						</div>
					{/if}
				</button>
			{:else}
				<div class="flex items-center gap-2.5">
					<div class="h-4 w-20 animate-pulse rounded bg-surface-2"></div>
					<div class="h-8 w-8 animate-pulse rounded-full bg-surface-2"></div>
				</div>
			{/if}

			<!-- Backdrop -->
			{#if dropdownOpen}
				<button
					type="button"
					aria-label="Tutup menu"
					class="fixed inset-0 z-20"
					onclick={() => (dropdownOpen = false)}
				></button>

				<!-- Dropdown -->
				<div
					class="absolute top-full right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
				>
					<!-- User info -->
					<div class="px-4 py-3">
						<p class="text-sm font-medium text-foreground">{displayName}</p>
						{#if userEmail}
							<p class="mt-0.5 truncate text-xs text-muted">{userEmail}</p>
						{/if}
					</div>

					<div class="h-px bg-border"></div>

					<!-- Logout -->
					<div class="p-1">
						<button
							type="button"
							onclick={handleSignOut}
							class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 cursor-pointer"
						>
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
								<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
								<polyline points="16 17 21 12 16 7" />
								<line x1="21" y1="12" x2="9" y2="12" />
							</svg>
							Keluar
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- CTA -->
	<div class="mb-8 rounded-2xl border border-accent/20 bg-accent/5 p-6">
		<h2 class="mb-1 text-lg font-semibold text-foreground">Ada masalah atau permintaan baru?</h2>
		<p class="mb-4 text-sm text-muted">
			AI akan membantu kamu menyusun laporan yang lengkap dalam beberapa menit.
		</p>
		<a href="/report/chat">
			<Button size="lg">
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
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Buat Laporan Baru
			</Button>
		</a>
	</div>

	<!-- Recent tickets -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-sm font-semibold text-foreground">Tiket Terbaru</h3>
			<a href="/history" class="text-xs text-muted transition-colors hover:text-accent">
				Lihat semua →
			</a>
		</div>

		{#if mockTickets.length === 0}
			<div class="rounded-xl border border-border bg-surface py-12 text-center">
				<p class="text-sm text-muted">Belum ada tiket. Buat laporan pertamamu!</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each mockTickets as ticket (ticket.id)}
					<TicketCard
						id={ticket.id}
						title={ticket.title}
						type={ticket.type}
						priority={ticket.priority}
						status={ticket.status}
						date={ticket.date}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
