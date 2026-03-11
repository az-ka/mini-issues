<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		type?: 'text' | 'email' | 'password';
		disabled?: boolean;
		class?: string;
		id?: string;
		name?: string;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		disabled = false,
		class: className = '',
		id,
		name
	}: Props = $props();
</script>

<input
	{type}
	{id}
	{name}
	{placeholder}
	{disabled}
	bind:value
	class="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 {className}"
/>
