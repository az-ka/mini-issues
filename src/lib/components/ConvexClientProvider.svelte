<script lang="ts">
	import { setupConvex, useConvexClient } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { useClerkContext } from 'svelte-clerk/client';

	let { children } = $props();

	// Initialize Convex Client
	setupConvex(PUBLIC_CONVEX_URL);
	const client = useConvexClient();

	// Get Clerk Context
	const ctx = useClerkContext();

	// Link Clerk Auth to Convex
	// This works because the function is called whenever Convex needs a token,
	// and ctx.session is reactive (Rune-based)
	client.setAuth(async () => {
		if (!ctx.session) return null;
		return ctx.session.getToken({ template: 'convex' });
	});
</script>

{@render children()}
