<script lang="ts">
	import { Search, Inbox } from 'lucide-svelte';

	interface Props {
		icon?: 'inbox' | 'search';
		title: string;
		message?: string;
		actionLabel?: string;
		actionHref?: string;
		onAction?: () => void;
	}

	let { icon = 'inbox', title, message, actionLabel, actionHref, onAction }: Props = $props();
</script>

<div class="rounded-xl border border-border bg-surface py-16 text-center">
	{#if icon === 'search'}
		<Search size={32} class="mx-auto mb-3 text-muted/40" />
	{:else}
		<Inbox size={32} class="mx-auto mb-3 text-muted/40" />
	{/if}

	<p class="text-sm font-medium text-foreground">{title}</p>
	{#if message}
		<p class="mt-1 text-xs text-muted">{message}</p>
	{/if}

	{#if actionHref}
		<a href={actionHref} class="mt-3 inline-block text-xs text-accent hover:underline">
			{actionLabel}
		</a>
	{:else if onAction}
		<button
			type="button"
			onclick={onAction}
			class="mt-3 cursor-pointer text-xs text-accent hover:underline"
		>
			{actionLabel}
		</button>
	{/if}
</div>
