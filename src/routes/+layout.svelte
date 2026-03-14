<script lang="ts">
	import './layout.css';
	import { ClerkProvider } from 'svelte-clerk/client';
	import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
	import ConvexClientProvider from '$lib/components/ConvexClientProvider.svelte';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head>
	<title>Mini Issues</title>
</svelte:head>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
	<ConvexClientProvider>
		{@render children()}
	</ConvexClientProvider>
</ClerkProvider>

<Toaster richColors theme="dark" position="bottom-center" />
