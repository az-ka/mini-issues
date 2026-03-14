<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		variant?: 'default' | 'danger';
		onclick?: () => void;
		separator?: boolean;
	}

	let { children, variant = 'default', onclick, separator = false }: Props = $props();
</script>

{#if separator}
	<div class="border-t border-border"></div>
{/if}
<button
	type="button"
	{onclick}
	class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors {variant ===
	'danger'
		? 'text-danger hover:bg-danger/5'
		: 'text-foreground hover:bg-surface-2'}"
>
	{@render children()}
</button>
