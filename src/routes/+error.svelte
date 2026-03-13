<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
	<p class="mb-2 font-mono text-5xl font-bold text-accent">{$page.status}</p>
	<p class="mb-1 text-base font-semibold text-foreground">
		{$page.status === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}
	</p>
	<p class="mb-6 text-sm text-muted">
		{$page.status === 404
			? 'Tiket atau halaman yang kamu cari tidak ada atau sudah dihapus.'
			: $page.error?.message ?? 'Silakan coba lagi atau hubungi administrator.'}
	</p>
	<Button href="/dashboard">Kembali ke Dashboard</Button>
</div>
