<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open, title, onclose, children, footer }: Props = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
		role="dialog"
		aria-modal="true"
		aria-label={title}
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-black/60"
			onclick={onclose}
			aria-label="Tutup dialog"
		></button>

		<!-- Panel -->
		<div
			class="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<p class="text-sm font-semibold text-foreground">{title}</p>
				<button
					type="button"
					onclick={onclose}
					class="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
					aria-label="Tutup"
				>
					<X size={16} />
				</button>
			</div>

			<!-- Body -->
			<div class="px-4 py-4 text-sm leading-relaxed text-muted">
				{@render children()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="flex justify-end gap-2 border-t border-border px-4 py-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
