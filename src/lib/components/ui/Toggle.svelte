<script lang="ts">
	interface Props {
		checked: boolean;
		disabled?: boolean;
		label: string;
		onchange?: (value: boolean) => void;
	}

	let { checked = $bindable(), disabled = false, label, onchange }: Props = $props();

	function handleClick() {
		if (disabled) return;
		checked = !checked;
		onchange?.(checked);
	}
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	onclick={handleClick}
	class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
		{disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
		{checked ? 'bg-accent' : 'bg-surface-2 ring-1 ring-border'}"
>
	<span
		class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
			{checked ? 'translate-x-4' : 'translate-x-0'}"
	></span>
</button>
