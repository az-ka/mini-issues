<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LoaderCircle } from 'lucide-svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		loading?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		target?: string;
		rel?: string;
		class?: string;
		onclick?: () => void;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		href,
		target,
		rel,
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const variantClasses: Record<Variant, string> = {
		primary: 'bg-accent text-bg font-semibold hover:bg-accent/85 active:scale-[0.98]',
		secondary:
			'bg-surface-2 text-foreground border border-border hover:border-accent/30 hover:bg-border active:scale-[0.98]',
		ghost: 'text-muted hover:text-foreground hover:bg-surface-2 active:scale-[0.98]',
		danger:
			'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20 active:scale-[0.98]'
	};

	const gaps: Record<Size, string> = {
		sm: 'gap-1.5',
		md: 'gap-2',
		lg: 'gap-2'
	};

	const sizeClasses: Record<Size, string> = {
		sm: `h-8 px-3 text-xs ${gaps.sm} rounded-md`,
		md: `h-9 px-4 text-sm ${gaps.md} rounded-lg`,
		lg: `h-10 px-5 text-sm ${gaps.lg} rounded-lg`
	};

	const baseClass = $derived(
		`relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
	);
</script>

{#if href}
	<a {href} {target} {rel} class={baseClass}>
		{@render children()}
	</a>
{:else}
	<button {type} disabled={disabled || loading} {onclick} class={baseClass} aria-busy={loading}>
		{#if loading}
			<span class="absolute inset-0 flex items-center justify-center">
				<LoaderCircle class="size-4 animate-spin" />
			</span>
			<span
				class="flex h-full w-full items-center justify-center opacity-0 select-none {gaps[size]}"
			>
				{@render children()}
			</span>
		{:else}
			{@render children()}
		{/if}
	</button>
{/if}
