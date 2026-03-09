<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ClerkProvider } from 'svelte-clerk/client';
	import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import ConvexClientProvider from '$lib/components/ConvexClientProvider.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Mini Issues</title>
</svelte:head>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
	<ConvexClientProvider>
		{@render children()}
	</ConvexClientProvider>
</ClerkProvider>
