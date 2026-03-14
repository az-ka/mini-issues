<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		trigger: Snippet;
		children: Snippet;
		align?: 'left' | 'right';
	}

	let { trigger, children, align = 'right' }: Props = $props();

	let open = $state(false);
	let wrapperEl = $state<HTMLElement | null>(null);

	// Position of the floating menu (fixed coords)
	let menuStyle = $state('');

	function calcPosition() {
		if (!wrapperEl) return;
		const r = wrapperEl.getBoundingClientRect();
		const MENU_WIDTH = 140;
		const MENU_ESTIMATED_HEIGHT = 100;
		const GAP = 4;

		const left =
			align === 'right'
				? Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
				: Math.max(r.left, 8);

		const spaceBelow = window.innerHeight - r.bottom;
		const spaceAbove = r.top;

		let top: number;
		if (spaceBelow >= MENU_ESTIMATED_HEIGHT + GAP || spaceBelow >= spaceAbove) {
			top = r.bottom + GAP;
		} else {
			top = r.top - MENU_ESTIMATED_HEIGHT - GAP;
		}

		menuStyle = `position:fixed;top:${top}px;left:${left}px;min-width:${MENU_WIDTH}px;`;
	}

	function toggle() {
		if (!open) calcPosition();
		open = !open;
	}

	function close() {
		open = false;
	}

	// Recalculate on scroll/resize while open
	$effect(() => {
		if (!open) return;
		const onScroll = () => calcPosition();
		const onResize = () => calcPosition();
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<div class="relative inline-flex" bind:this={wrapperEl}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span onclick={toggle}>
		{@render trigger()}
	</span>
</div>

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40" onclick={close}></div>

	<!-- Menu — rendered fixed, escapes any overflow parent -->
	<div
		style={menuStyle}
		class="z-50 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
	>
		{@render children()}
	</div>
{/if}
