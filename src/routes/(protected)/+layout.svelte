<script lang="ts">
	import { useClerkContext } from 'svelte-clerk/client';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/api';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const ctx = useClerkContext();

	const userEmail = $derived(
		ctx.user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() ?? null
	);

	// Always run — Convex returns false internally if not authenticated
	const accessCheck = useQuery(api.whitelist.isCurrentUserAllowed, {});

	const isAllowed = $derived(accessCheck.data === true);

	const isChecking = $derived(
		ctx.user === undefined || (userEmail !== null && accessCheck.isLoading === true)
	);

	const isDenied = $derived(
		!isChecking &&
			ctx.user !== null &&
			ctx.user !== undefined &&
			userEmail !== null &&
			!isAllowed &&
			accessCheck.isLoading === false
	);

	$effect(() => {
		if (!isDenied) return;
		const clerk = ctx.clerk;
		if (!clerk) return;
		clerk.signOut().then(() => {
			window.location.replace('/?error=not_whitelisted');
		});
	});
</script>

{#if isChecking}
	<!-- Checking access — brief loading state -->
	<div class="flex min-h-dvh items-center justify-center">
		<div class="flex flex-col items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10"
			>
				<svg
					class="animate-spin text-accent"
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 12a9 9 0 11-6.219-8.56" />
				</svg>
			</div>
			<p class="text-sm text-muted">Memeriksa akses...</p>
		</div>
	</div>
{:else if isDenied}
	<!-- Briefly shown before redirect/signout -->
	<div class="flex min-h-dvh items-center justify-center p-4">
		<div class="w-full max-w-sm text-center">
			<div
				class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-danger"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			</div>
			<p class="text-sm font-medium text-foreground">Akses ditolak</p>
			<p class="mt-1 text-xs text-muted">Email kamu belum terdaftar. Mengarahkan ulang...</p>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
