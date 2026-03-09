<script lang="ts">
	import { Show, SignInButton, UserButton } from 'svelte-clerk/client';
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
				<p class="text-sm text-zinc-500">Welcome back!</p>
				<div class="flex items-center gap-3 rounded-full border border-zinc-200 bg-white p-2 pl-4 shadow-sm">
					<span class="text-sm font-medium text-zinc-700">Manage Profile</span>
					<UserButton afterSignOutUrl="/" />
				</div>
			</div>
		</Show>
	</div>
</div>
