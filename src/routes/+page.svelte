<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let email = $state('');
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	<div class="w-full max-w-sm">

		<!-- Brand -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
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
			<div class="mb-5">
				<label for="email" class="mb-1.5 block text-sm font-medium text-foreground">
					Email kantor
				</label>
				<Input
					id="email"
					type="email"
					bind:value={email}
					placeholder="nama@perusahaan.com"
				/>
			</div>

			<Button type="submit" size="lg" class="w-full">
				Masuk
			</Button>

			<p class="mt-4 text-center text-xs text-muted">
				Belum punya akses?
				<a href="mailto:admin@perusahaan.com" aria-label="Hubungi admin melalui email" class="text-accent hover:underline">Hubungi admin</a>
			</p>
		</div>

		<!-- Error state (email not in whitelist) -->
		<div class="mt-3 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
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
			<p class="text-xs text-danger/90">
				Email kamu belum terdaftar. Hubungi admin untuk mendapatkan akses.
			</p>
		</div>

	</div>
</div>
