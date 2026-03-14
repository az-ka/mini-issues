<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		rows?: number;
		disabled?: boolean;
		class?: string;
		id?: string;
		name?: string;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		rows = 4,
		disabled = false,
		class: className = '',
		id,
		name
	}: Props = $props();
</script>

<textarea
	{id}
	{name}
	{rows}
	{placeholder}
	{disabled}
	bind:value
	class="w-full resize-none rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 {className}"
></textarea>
