<script lang="ts">
	import { useClerkContext } from 'svelte-clerk/client';

	const ctx = useClerkContext();

	$effect(() => {
		const executeRedirect = () => {
			ctx.clerk
				?.handleRedirectCallback({
					signInForceRedirectUrl: '/dashboard',
					signUpForceRedirectUrl: '/dashboard'
				})
				.catch((err) => {
					console.error('[sso-callback] Error in handleRedirectCallback:', err);
				});
		};

		if (ctx.clerk?.loaded) {
			executeRedirect();
			return;
		}

		let intervalId: number;

		// Poll for clerk.loaded since it may not trigger Svelte's reactivity automatically
		if (ctx.clerk && !ctx.clerk.loaded) {
			intervalId = window.setInterval(() => {
				if (ctx.clerk?.loaded) {
					window.clearInterval(intervalId);
					executeRedirect();
				}
			}, 100);
		}

		return () => {
			if (intervalId) window.clearInterval(intervalId);
		};
	});
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	<div class="flex flex-col items-center gap-4">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10"
		>
			<svg
				class="animate-spin text-accent"
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
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
		<div class="text-center">
			<p class="text-sm font-medium text-foreground">Menyelesaikan verifikasi...</p>
			<p class="mt-1 text-xs text-muted">Mohon tunggu sebentar.</p>
		</div>
	</div>
</div>
