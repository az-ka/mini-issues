<script lang="ts">
	import { Show, SignInButton } from 'svelte-clerk/client';
	import { useClerkContext } from 'svelte-clerk/client';
	import { useQuery } from 'convex-svelte';
	import { api } from '../convex/_generated/api';

	const ctx = useClerkContext();
	
	// Get current user data from Convex reactively
	const userQuery = $derived(useQuery(api.users.currentUser, {}));
	const userData = $derived(userQuery?.data);

	async function handleSignOut() {
		if (ctx.clerk) {
			await ctx.clerk.signOut();
		}
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
	<h1 class="text-4xl font-bold tracking-tight text-zinc-900">Mini Issues</h1>
	<p class="max-w-md text-zinc-600">
		A simple issue tracker built with Svelte 5, Convex, and Clerk.
	</p>

	<div class="mt-4">
		<Show when="signed-out">
			<div class="flex flex-col gap-2">
				<p class="text-sm text-zinc-500">You are not signed in.</p>
				<SignInButton class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950" />
			</div>
		</Show>

		<Show when="signed-in">
			<div class="flex flex-col items-center gap-4">
				{#if userData}
					<div class="flex items-center gap-3 rounded-full border border-zinc-200 bg-white p-1.5 pl-4 shadow-sm">
						<span class="text-sm font-medium text-zinc-700">
							{userData.name || 'User'} 
							<span class="ml-1 text-[10px] uppercase tracking-wider text-zinc-400">({userData.role})</span>
						</span>
						<button 
							type="button"
							onclick={handleSignOut}
							class="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
						>
							Sign Out
						</button>
					</div>
				{:else}
					<div class="flex items-center gap-2 text-sm text-zinc-400">
						<div class="h-2 w-2 animate-bounce rounded-full bg-zinc-300"></div>
						Loading profile...
					</div>
				{/if}
			</div>
		</Show>
	</div>
</div>
