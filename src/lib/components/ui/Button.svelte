<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-accent text-bg font-semibold hover:bg-accent/85 active:scale-[0.98]',
		secondary:
			'bg-surface-2 text-foreground border border-border hover:border-accent/30 hover:bg-border active:scale-[0.98]',
		ghost: 'text-muted hover:text-foreground hover:bg-surface-2 active:scale-[0.98]',
		danger: 'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20 active:scale-[0.98]'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md',
		md: 'px-4 py-2 text-sm gap-2 rounded-lg',
		lg: 'px-5 py-2.5 text-sm gap-2 rounded-lg'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 {variantClasses[variant]} {sizeClasses[size]} {className}"
>
	{@render children()}
</button>
