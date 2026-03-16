<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/api';
	import { extractError } from '$lib/utils';
	import BoardForm from '$lib/components/BoardForm.svelte';
	import type { TrelloWorkspace } from '$lib/components/BoardForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
	import DropdownMenuItem from '$lib/components/ui/DropdownMenuItem.svelte';
	import { RefreshCw, Plus, EllipsisVertical, Pencil, Trash2, X } from 'lucide-svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';

	const client = useConvexClient();
	const boardsQuery = useQuery(api.trelloBoards.list, {});
	const trelloSyncQuery = useQuery(api.trelloSync.get, {});

	const boards = $derived(boardsQuery.data ?? []);

	// Parse synced Trello data from Convex cache
	const trelloData = $derived<TrelloWorkspace[]>(
		(() => {
			const raw = trelloSyncQuery.data?.data;
			if (!raw) return [];
			try {
				return JSON.parse(raw);
			} catch {
				return [];
			}
		})()
	);

	const syncedAt = $derived(trelloSyncQuery.data?.syncedAt ?? null);

	let isSyncing = $state(false);
	let syncError = $state('');

	async function handleSync() {
		isSyncing = true;
		syncError = '';
		try {
			const res = await fetch('/api/trello/sync');
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body?.message ?? 'Gagal menghubungi Trello.');
			}
			const data: TrelloWorkspace[] = await res.json();
			await client.mutation(api.trelloSync.save, { data: JSON.stringify(data) });
		} catch (err) {
			syncError = extractError(err, 'Gagal sinkronisasi. Periksa API key Trello.');
		} finally {
			isSyncing = false;
		}
	}

	function formatSyncedAt(ts: number): string {
		return new Intl.DateTimeFormat('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(ts));
	}

	// Add form state
	let boardName = $state('');
	let boardWorkspaceId = $state('');
	let boardWorkspaceName = $state('');
	let boardBoardId = $state('');
	let boardBoardName = $state('');
	let boardListId = $state('');
	let boardListName = $state('');
	let boardAddError = $state('');
	let isAddingBoard = $state(false);
	let showAddBoardForm = $state(false);

	// Edit form state
	let editingBoardId = $state<string | null>(null);
	let editBoardName = $state('');
	let editBoardWorkspaceId = $state('');
	let editBoardWorkspaceName = $state('');
	let editBoardBoardId = $state('');
	let editBoardBoardName = $state('');
	let editBoardListId = $state('');
	let editBoardListName = $state('');

	let deletingBoard = $state<{ id: string; name: string } | null>(null);
	let boardError = $state<string | null>(null);

	async function handleAddBoard() {
		if (!boardName.trim() || !boardBoardId.trim() || !boardListId.trim() || isAddingBoard) return;
		isAddingBoard = true;
		boardAddError = '';
		try {
			await client.mutation(api.trelloBoards.add, {
				name: boardName.trim(),
				boardId: boardBoardId.trim(),
				boardName: boardBoardName || undefined,
				listId: boardListId.trim(),
				listName: boardListName || undefined,
				isActive: true,
				workspaceId: boardWorkspaceId || undefined,
				workspaceName: boardWorkspaceName || undefined
			});
			boardName = '';
			boardWorkspaceId = '';
			boardWorkspaceName = '';
			boardBoardId = '';
			boardBoardName = '';
			boardListId = '';
			boardListName = '';
			showAddBoardForm = false;
		} catch (err) {
			boardAddError = extractError(err, 'Gagal menambahkan board. Coba lagi.');
		} finally {
			isAddingBoard = false;
		}
	}

	async function handleDeleteBoard(id: string) {
		boardError = null;
		try {
			await client.mutation(api.trelloBoards.remove, { id: id as never });
			deletingBoard = null;
		} catch (err) {
			deletingBoard = null;
			boardError = extractError(err, 'Gagal menghapus board. Coba lagi.');
		}
	}

	function startEditBoard(board: (typeof boards)[0]) {
		editingBoardId = board._id;
		editBoardName = board.name;
		editBoardBoardId = board.boardId;
		editBoardBoardName = board.boardName ?? '';
		editBoardListId = board.listId;
		editBoardListName = board.listName ?? '';
		editBoardWorkspaceId = board.workspaceId ?? '';
		editBoardWorkspaceName = board.workspaceName ?? '';
	}

	async function handleToggleActive(board: (typeof boards)[0]) {
		try {
			await client.mutation(api.trelloBoards.update, {
				id: board._id as never,
				name: board.name,
				boardId: board.boardId,
				boardName: board.boardName,
				listId: board.listId,
				listName: board.listName,
				isActive: !board.isActive,
				workspaceId: board.workspaceId,
				workspaceName: board.workspaceName
			});
		} catch (err) {
			boardError = extractError(err, 'Gagal mengubah status board.');
		}
	}

	async function handleUpdateBoard(id: string) {
		const board = boards.find((b) => b._id === id);
		if (!board) return;
		try {
			await client.mutation(api.trelloBoards.update, {
				id: id as never,
				name: editBoardName.trim(),
				boardId: editBoardBoardId.trim(),
				boardName: editBoardBoardName || undefined,
				listId: editBoardListId.trim(),
				listName: editBoardListName || undefined,
				isActive: board.isActive,
				workspaceId: editBoardWorkspaceId || undefined,
				workspaceName: editBoardWorkspaceName || undefined
			});
			editingBoardId = null;
		} catch (err) {
			boardError = extractError(err, 'Gagal mengupdate board. Coba lagi.');
		}
	}
</script>

<!-- Section header -->
<div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
	<div>
		<h2 class="text-sm font-semibold text-foreground">Trello Boards</h2>
		<p class="mt-0.5 text-xs text-muted">
			{boards.length} board{boards.length !== 1 ? 's' : ''} terhubung
			{#if syncedAt}
				· disinkron {formatSyncedAt(syncedAt)}
			{/if}
		</p>
	</div>
	<div class="flex items-center gap-2 sm:shrink-0">
		<Button
			class="flex-1 sm:flex-none"
			variant="secondary"
			loading={isSyncing}
			onclick={handleSync}
		>
			<RefreshCw />
			Sinkronisasi
		</Button>
		<Button
			class="flex-1 sm:flex-none"
			onclick={() => {
				showAddBoardForm = !showAddBoardForm;
				boardAddError = '';
			}}
		>
			<Plus />
			Tambah
		</Button>
	</div>
</div>

{#if syncError}
	<p class="mb-3 text-xs text-danger">{syncError}</p>
{/if}

<!-- Add board form (collapsible) -->
{#if showAddBoardForm}
	<div class="mb-4 rounded-2xl border border-accent/30 bg-surface p-5">
		<BoardForm
			bind:name={boardName}
			bind:workspaceId={boardWorkspaceId}
			bind:workspaceName={boardWorkspaceName}
			bind:boardId={boardBoardId}
			bind:boardName={boardBoardName}
			bind:listId={boardListId}
			bind:listName={boardListName}
			{trelloData}
			error={boardAddError}
			isLoading={isAddingBoard}
			submitLabel="Tambah Board"
			onsubmit={handleAddBoard}
			oncancel={() => {
				showAddBoardForm = false;
				boardAddError = '';
			}}
		/>
	</div>
{/if}

<!-- Boards list -->
{#if boardsQuery.isLoading}
	<div class="flex flex-col gap-2">
		{#each [1, 2] as i (i)}
			<div class="h-16 animate-pulse rounded-xl bg-surface"></div>
		{/each}
	</div>
{:else if boards.length === 0}
	<div class="rounded-xl border border-border bg-surface py-10 text-center">
		<p class="text-sm text-muted">Belum ada board terdaftar.</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl border border-border bg-surface">
		{#each boards as board (board._id)}
			<div class="border-b border-border last:border-b-0">
				<!-- Board item row -->
				<div class="flex items-center gap-3 px-4 py-3">
					<!-- Active dot indicator -->
					<span
						class="h-2 w-2 shrink-0 rounded-full {board.isActive ? 'bg-success' : 'bg-muted/40'}"
					></span>

					<!-- Name + IDs -->
					<div class="min-w-0 flex-1">
						<span class="text-sm font-medium text-foreground">{board.name}</span>
						<p class="mt-0.5 truncate text-xs text-muted">
							{#if board.workspaceName || board.boardName || board.listName}
								{[board.workspaceName, board.boardName, board.listName].filter(Boolean).join(' · ')}
							{:else}
								<span class="font-mono">{board.boardId} · {board.listId}</span>
							{/if}
						</p>
					</div>

					<Toggle
						bind:checked={board.isActive}
						label="Toggle aktif {board.name}"
						onchange={() => handleToggleActive(board)}
					/>

					<!-- Three-dot menu -->
					<DropdownMenu>
						{#snippet trigger()}
							<button
								type="button"
								aria-label="Menu {board.name}"
								class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
							>
								<EllipsisVertical size={15} />
							</button>
						{/snippet}
						<DropdownMenuItem onclick={() => startEditBoard(board)}>
							<Pencil size={13} class="text-muted" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="danger"
							separator
							onclick={() => (deletingBoard = { id: board._id, name: board.name })}
						>
							<Trash2 size={13} />
							Hapus
						</DropdownMenuItem>
					</DropdownMenu>
				</div>

				<!-- Inline edit form (expands below row) -->
				{#if editingBoardId === board._id}
					<div class="border-t border-accent/20 bg-surface-2/40 px-4 py-4">
						<BoardForm
							bind:name={editBoardName}
							bind:workspaceId={editBoardWorkspaceId}
							bind:workspaceName={editBoardWorkspaceName}
							bind:boardId={editBoardBoardId}
							bind:boardName={editBoardBoardName}
							bind:listId={editBoardListId}
							bind:listName={editBoardListName}
							{trelloData}
							submitLabel="Simpan"
							onsubmit={() => handleUpdateBoard(board._id)}
							oncancel={() => (editingBoardId = null)}
						/>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

{#if boardError}
	<div
		class="mt-3 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3"
	>
		<p class="flex-1 text-xs text-danger/90">{boardError}</p>
		<button
			type="button"
			aria-label="Tutup error"
			onclick={() => (boardError = null)}
			class="shrink-0 text-danger/60 hover:text-danger"
		>
			<X size={13} />
		</button>
	</div>
{/if}

<!-- Delete confirmation modal -->
<Dialog open={!!deletingBoard} title="Hapus Board" onclose={() => (deletingBoard = null)}>
	Yakin ingin menghapus board <strong class="text-foreground">{deletingBoard?.name}</strong>?
	Tindakan ini tidak dapat dibatalkan.
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (deletingBoard = null)}>Batal</Button>
		<Button variant="danger" onclick={() => deletingBoard && handleDeleteBoard(deletingBoard.id)}>
			Ya, hapus
		</Button>
	{/snippet}
</Dialog>
