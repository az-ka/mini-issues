<script lang="ts">
	import { useClerkContext } from 'svelte-clerk/client';
	import { LoaderCircle } from 'lucide-svelte';

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
			<LoaderCircle size={24} class="animate-spin text-accent" />
		</div>
		<div class="text-center">
			<p class="text-sm font-medium text-foreground">Menyelesaikan verifikasi...</p>
			<p class="mt-1 text-xs text-muted">Mohon tunggu sebentar.</p>
		</div>
	</div>
</div>
