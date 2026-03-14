<script lang="ts">
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
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="mx-auto mb-3 text-muted/40"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="32"
			height="32"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="mx-auto mb-3 text-muted/40"
		>
			<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
			<path
				d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"
			/>
		</svg>
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
