<script lang="ts">
	import { page } from '$app/state';
	import { useClerkContext } from 'svelte-clerk/client';

	const ctx = useClerkContext();

	let isLoading = $state(false);
	let error = $state('');

	$effect(() => {
		const urlError = page.url.searchParams.get('error');
		if (urlError === 'not_whitelisted') {
			error = 'Email kamu belum terdaftar di whitelist. Hubungi admin untuk mendapatkan akses.';
			history.replaceState({}, '', '/');
		}
	});

	async function handleGoogleLogin() {
		const clerk = ctx.clerk;
		if (!clerk || isLoading) return;

		isLoading = true;
		error = '';

		try {
			await clerk.client!.signIn.authenticateWithRedirect({
				strategy: 'oauth_google',
				redirectUrl: '/sso-callback',
				redirectUrlComplete: '/dashboard'
			});
		} catch (err) {
			error = 'Terjadi kesalahan. Coba lagi.';
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	<div class="w-full max-w-sm">
		<!-- Brand -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10"
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
					class="text-accent"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-foreground">Mini Issues</h1>
			<p class="mt-1.5 text-sm text-muted">Laporkan masalah dengan mudah</p>
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-border bg-surface p-6">
			<p class="mb-5 text-center text-sm text-muted">
				Masuk menggunakan akun Google yang sudah di whitelist.
			</p>

			<button
				type="button"
				onclick={handleGoogleLogin}
				disabled={isLoading}
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/30 hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isLoading}
					<svg
						class="animate-spin text-muted"
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
					Mengarahkan...
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Lanjutkan dengan Google
				{/if}
			</button>

			{#if error}
				<div
					class="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="mt-0.5 shrink-0 text-danger"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<p class="text-xs leading-relaxed text-danger/90">{error}</p>
				</div>
			{/if}
		</div>

		<!-- <p class="mt-4 text-center text-xs text-muted">
			Belum punya akses?
			<a
				href="mailto:admin@perusahaan.com"
				aria-label="Hubungi admin melalui email"
				class="text-accent hover:underline"
			>
				Hubungi admin
			</a>
		</p> -->
	</div>
</div>
