<script lang="ts">
	interface Props {
		value?: string;
		disabled?: boolean;
		class?: string;
		id?: string;
		name?: string;
		onchange?: (e: Event) => void;
		children: import('svelte').Snippet;
	}

	let {
		value = $bindable(''),
		disabled = false,
		class: className = '',
		id,
		name,
		onchange,
		children
	}: Props = $props();
</script>

<select
	{id}
	{name}
	{disabled}
	bind:value
	{onchange}
	class="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 {className}"
>
	{@render children()}
</select>
