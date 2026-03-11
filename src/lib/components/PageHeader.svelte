<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		backHref?: string;
		backLabel?: string;
		right?: Snippet;
	}

	let { title, backHref, backLabel = 'Kembali', right }: Props = $props();
</script>

<header class="mb-6 flex items-center gap-2">
	{#if backHref}
		<a
			href={backHref}
			aria-label={backLabel}
			class="flex items-center justify-center rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
		>
			<svg
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
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</a>
	{/if}

	<h1 class="flex-1 text-base font-semibold text-foreground">{title}</h1>

	{#if right}
		<div class="flex items-center gap-2">
			{@render right()}
		</div>
	{/if}
</header>
