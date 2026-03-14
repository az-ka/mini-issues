<script lang="ts">
	import { untrack } from 'svelte';
	import { setupConvex, useConvexClient } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { useClerkContext } from 'svelte-clerk/client';
	import { api } from '$convex/api';

	let { children } = $props();

	// Initialize Convex Client
	setupConvex(PUBLIC_CONVEX_URL);
	const client = useConvexClient();

	// Get Clerk Context
	const ctx = useClerkContext();

	// Link Clerk Auth to Convex with a more robust waiting mechanism
	client.setAuth(async () => {
		// Wait for session to be available (max 1 second)
		let attempts = 0;
		while ((!ctx.isLoaded || !ctx.session) && attempts < 10) {
			await new Promise((r) => setTimeout(r, 100));
			attempts++;
		}

		if (!ctx.session) return null;
		return ctx.session.getToken({ template: 'convex' });
	});

	// State to track if we've successfully synced during this login session
	let lastSyncedSessionId = $state<string | null>(null);

	// Automatically sync user to Convex after login
	$effect(() => {
		const isLoaded = ctx.isLoaded;
		const session = ctx.session;
		const sessionId = session?.id;
		const isSignedIn = !!ctx.auth.userId;

		if (isLoaded && isSignedIn && sessionId && lastSyncedSessionId !== sessionId) {
			untrack(async () => {
				try {
					const token = await session.getToken({ template: 'convex' });
					if (!token) return;

					const result = await client.mutation(api.users.syncUser, {});
					if (result) {
						lastSyncedSessionId = sessionId;
					}
				} catch (err) {
					console.error('Failed to sync user to Convex:', err);
				}
			});
		} else if (isLoaded && !isSignedIn) {
			lastSyncedSessionId = null;
		}
	});
</script>

{@render children()}
