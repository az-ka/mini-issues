<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		title?: string;
		message?: string;
		backHref?: string;
		backLabel?: string;
	}

	let {
		title = 'Tidak Ditemukan',
		message = 'Halaman yang kamu cari tidak ada atau kamu tidak punya akses.',
		backHref = '/dashboard',
		backLabel = 'Kembali ke Dashboard'
	}: Props = $props();
</script>

<div class="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
	<p class="mb-2 font-mono text-5xl font-bold text-accent">404</p>
	<p class="mb-1 text-base font-semibold text-foreground">{title}</p>
	<p class="mb-6 text-sm text-muted">{message}</p>
	<Button href={backHref}>{backLabel}</Button>
</div>
