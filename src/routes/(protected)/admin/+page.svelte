<script lang="ts">
	import { useClerkContext } from 'svelte-clerk/client';
	import { useQuery } from 'convex-svelte';
	import { goto } from '$app/navigation';
	import { api } from '$convex/api';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import WhitelistSection from '$lib/components/admin/WhitelistSection.svelte';
	import TrelloBoardsSection from '$lib/components/admin/TrelloBoardsSection.svelte';

	const ctx = useClerkContext();
	const adminQuery = useQuery(api.whitelist.isCurrentUserAdmin, {});
	const whitelistQuery = useQuery(api.whitelist.list, {});

	const userEmail = $derived(
		ctx.user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() ?? ''
	);
	const entries = $derived(whitelistQuery.data ?? []);

	// Reactively redirect if admin access is revoked while on this page
	$effect(() => {
		if (adminQuery.isLoading) return;
		if (adminQuery.data === false) goto('/dashboard');
	});
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Admin" backHref="/dashboard" backLabel="Kembali ke Dashboard">
		{#snippet right()}
			<span
				class="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
			>
				{entries.length} whitelist
			</span>
		{/snippet}
	</PageHeader>

	<!-- Admin badge -->
	{#if userEmail}
		<div
			class="mb-6 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5"
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
				class="shrink-0 text-accent"
			>
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
			</svg>
			<span class="text-xs text-muted">
				Login sebagai admin: <span class="font-medium text-foreground">{userEmail}</span>
			</span>
		</div>
	{/if}

	<WhitelistSection />

	<div class="mt-10">
		<TrelloBoardsSection />
	</div>

	<div class="pb-8"></div>
</div>
