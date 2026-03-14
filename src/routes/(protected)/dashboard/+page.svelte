<script lang="ts">
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { getInitials, relativeDate } from '$lib/utils';
	import { api } from '$convex/api';
	import Button from '$lib/components/ui/Button.svelte';
	import TicketCard from '$lib/components/TicketCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	const ctx = useClerkContext();
	const ticketsQuery = useQuery(api.reports.listRecent, () => ({}));

	const user = $derived(ctx.user);
	const displayName = $derived(user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'Kamu');
	const initials = $derived(getInitials(user?.fullName));
	const avatarUrl = $derived(user?.imageUrl);
	const userEmail = $derived(user?.primaryEmailAddress?.emailAddress ?? '');

	let dropdownOpen = $state(false);

	async function handleSignOut() {
		const clerk = ctx.clerk;
		if (!clerk) return;
		await clerk.signOut();
		goto('/');
	}
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
					class="flex cursor-pointer items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-surface-2"
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
							class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
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
		<Button size="lg" href="/report/chat">
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
	</div>

	<!-- Recent tickets -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-sm font-semibold text-foreground">Laporan Terbaru</h3>
			<a href="/history" class="text-xs text-muted transition-colors hover:text-accent">
				Lihat semua →
			</a>
		</div>

		{#if ticketsQuery.isLoading}
			<div class="flex flex-col gap-2">
				{#each [1, 2, 3] as _, i (i)}
					<div class="h-16 animate-pulse rounded-xl bg-surface-2"></div>
				{/each}
			</div>
		{:else if ticketsQuery.data && ticketsQuery.data.length > 0}
			<div class="flex flex-col gap-2">
				{#each ticketsQuery.data as ticket (ticket._id)}
					<TicketCard
						id={ticket._id}
						title={ticket.title}
						type={ticket.type as 'bug' | 'feature' | 'improvement'}
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
		{:else}
			<EmptyState
				icon="inbox"
				title="Belum ada laporan"
				message="Buat laporan pertama untuk memulai."
				actionLabel="Buat laporan baru"
				actionHref="/report/chat"
			/>
		{/if}
	</div>
</div>
