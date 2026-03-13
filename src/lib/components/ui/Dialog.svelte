<script lang="ts">
	import type { Snippet } from 'svelte';

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
		<div class="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<p class="text-sm font-semibold text-foreground">{title}</p>
				<button
					type="button"
					onclick={onclose}
					class="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
					aria-label="Tutup"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<!-- Body -->
			<div class="px-4 py-4 text-sm text-muted leading-relaxed">
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
