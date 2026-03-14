<script lang="ts">
	import type { Snippet } from 'svelte';

	type Color = 'purple' | 'red' | 'yellow' | 'green' | 'blue' | 'muted';

	interface Props {
		color?: Color;
		class?: string;
		children: Snippet;
	}

	let { color = 'muted', class: className = '', children }: Props = $props();

	const colorClasses: Record<Color, string> = {
		purple: 'bg-accent/10 text-accent border border-accent/20',
		red: 'bg-danger/10 text-danger border border-danger/20',
		yellow: 'bg-warning/10 text-warning border border-warning/20',
		green: 'bg-success/10 text-success border border-success/20',
		blue: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
		muted: 'bg-surface-2 text-muted border border-border'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {colorClasses[
		color
	]} {className}"
>
	{@render children()}
</span>
