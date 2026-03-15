<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { ChevronLeft } from 'lucide-svelte';

	interface Props {
		title: string;
		backHref?: string;
		backLabel?: string;
		right?: Snippet;
	}

	let { title, backHref, backLabel = 'Kembali', right }: Props = $props();

	function goBack() {
		if (history.length > 1) {
			history.back();
		} else {
			goto(backHref ?? '/');
		}
	}
</script>

<header class="mb-6 flex items-center gap-2">
	{#if backHref}
		<a
			href={backHref}
			aria-label={backLabel}
			onclick={(e) => {
				e.preventDefault();
				goBack();
			}}
			class="flex items-center justify-center rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
		>
			<ChevronLeft size={18} />
		</a>
	{/if}

	<h1 class="flex-1 text-base font-semibold text-foreground">{title}</h1>

	{#if right}
		<div class="flex items-center gap-2">
			{@render right()}
		</div>
	{/if}
</header>
