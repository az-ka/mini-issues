<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	export interface TrelloList {
		id: string;
		name: string;
	}

	export interface TrelloBoard {
		id: string;
		name: string;
		lists: TrelloList[];
	}

	export interface TrelloWorkspace {
		id: string;
		name: string;
		boards: TrelloBoard[];
	}

	interface Props {
		// Bindable fields saved to Convex
		name: string; // custom label
		workspaceId: string;
		workspaceName: string;
		boardId: string;
		boardName: string; // auto from Trello
		listId: string;
		listName: string; // auto from Trello
		// Trello data from Convex cache
		trelloData?: TrelloWorkspace[];
		error?: string;
		isLoading?: boolean;
		submitLabel?: string;
		onsubmit: () => void;
		oncancel?: () => void;
	}

	let {
		name = $bindable(),
		workspaceId = $bindable(),
		workspaceName = $bindable(),
		boardId = $bindable(),
		boardName = $bindable(),
		listId = $bindable(),
		listName = $bindable(),
		trelloData = [],
		error = '',
		isLoading = false,
		submitLabel = 'Simpan',
		onsubmit,
		oncancel
	}: Props = $props();

	const hasSyncData = $derived(trelloData.length > 0);

	const filteredBoards = $derived<TrelloBoard[]>(
		trelloData.find((ws) => ws.id === workspaceId)?.boards ?? []
	);

	const filteredLists = $derived<TrelloList[]>(
		filteredBoards.find((b) => b.id === boardId)?.lists ?? []
	);

	const isValid = $derived(
		name.trim().length > 0 && boardId.trim().length > 0 && listId.trim().length > 0
	);

	function onWorkspaceChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		workspaceId = val;
		workspaceName = trelloData.find((ws) => ws.id === val)?.name ?? '';
		boardId = '';
		boardName = '';
		listId = '';
		listName = '';
	}

	function onBoardChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		boardId = val;
		boardName = filteredBoards.find((b) => b.id === val)?.name ?? '';
		listId = '';
		listName = '';
	}

	function onListChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		listId = val;
		listName = filteredLists.find((l) => l.id === val)?.name ?? '';
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Custom name -->
	<div>
		<label for="bf-name" class="mb-1.5 block text-xs font-medium text-muted"> Nama Label </label>
		<Input
			id="bf-name"
			bind:value={name}
			placeholder="Contoh: Bug FE, Feature BE..."
			disabled={isLoading}
		/>
	</div>

	<!-- Workspace select -->
	<div>
		<label for="bf-workspace" class="mb-1.5 block text-xs font-medium text-muted">Workspace</label>
		<Select
			id="bf-workspace"
			value={workspaceId}
			onchange={onWorkspaceChange}
			disabled={!hasSyncData || isLoading}
		>
			<option value="">-- Pilih workspace --</option>
			{#each trelloData as ws (ws.id)}
				<option value={ws.id}>{ws.name}</option>
			{/each}
		</Select>
	</div>

	<!-- Board select -->
	<div>
		<label for="bf-board" class="mb-1.5 block text-xs font-medium text-muted">Board</label>
		<Select
			id="bf-board"
			value={boardId}
			onchange={onBoardChange}
			disabled={!workspaceId || isLoading}
		>
			<option value="">-- Pilih board --</option>
			{#each filteredBoards as board (board.id)}
				<option value={board.id}>{board.name}</option>
			{/each}
		</Select>
	</div>

	<!-- List select -->
	<div>
		<label for="bf-list" class="mb-1.5 block text-xs font-medium text-muted">List</label>
		<Select id="bf-list" value={listId} onchange={onListChange} disabled={!boardId || isLoading}>
			<option value="">-- Pilih list --</option>
			{#each filteredLists as list (list.id)}
				<option value={list.id}>{list.name}</option>
			{/each}
		</Select>
	</div>

	{#if !hasSyncData}
		<p class="text-xs text-muted">
			Klik <span class="font-medium text-foreground">Sinkronisasi</span> terlebih dahulu untuk memuat
			data dari Trello.
		</p>
	{/if}

	{#if error}
		<p class="text-xs text-danger">{error}</p>
	{/if}

	<div class="flex items-center justify-end gap-2">
		{#if oncancel}
			<Button variant="secondary" onclick={oncancel}>Batal</Button>
		{/if}
		<Button disabled={!isValid} loading={isLoading} onclick={onsubmit}>{submitLabel}</Button>
	</div>
</div>
