<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		name: string;
		boardId: string;
		listId: string;
		error?: string;
		isLoading?: boolean;
		submitLabel?: string;
		onsubmit: () => void;
		oncancel?: () => void;
	}

	let {
		name = $bindable(),
		boardId = $bindable(),
		listId = $bindable(),
		error = '',
		isLoading = false,
		submitLabel = 'Simpan',
		onsubmit,
		oncancel
	}: Props = $props();

	const isValid = $derived(
		name.trim().length > 0 && boardId.trim().length > 0 && listId.trim().length > 0
	);
</script>

<div class="flex flex-col gap-3">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<div>
			<label for="bf-name" class="mb-1.5 block text-xs font-medium text-muted">Nama Board</label>
			<Input id="bf-name" bind:value={name} placeholder="FE / BE / Mobile" disabled={isLoading} />
		</div>
		<div>
			<label for="bf-boardid" class="mb-1.5 block text-xs font-medium text-muted">
				Board ID <span class="text-muted/60">(dari URL Trello)</span>
			</label>
			<Input id="bf-boardid" bind:value={boardId} placeholder="Ui5PCcsL" disabled={isLoading} />
		</div>
	</div>
	<div>
		<label for="bf-listid" class="mb-1.5 block text-xs font-medium text-muted">
			List ID <span class="text-muted/60">(target list, e.g. Backlog/Todo)</span>
		</label>
		<Input
			id="bf-listid"
			bind:value={listId}
			placeholder="64abc123def456..."
			disabled={isLoading}
		/>
	</div>

	{#if error}
		<p class="text-xs text-danger">{error}</p>
	{/if}

	<div class="flex items-center justify-end gap-2">
		{#if oncancel}
			<Button variant="secondary" onclick={oncancel}>Batal</Button>
		{/if}
		<Button disabled={!isValid || isLoading} onclick={onsubmit}>
			{#if isLoading}
				<svg
					class="animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg
				>
				Menyimpan...
			{:else}
				{submitLabel}
			{/if}
		</Button>
	</div>
</div>
