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
			disabled={isSyncing}
			onclick={handleSync}
		>
			{#if isSyncing}
				<svg
					class="animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 12a9 9 0 11-6.219-8.56" />
				</svg>
				Sinkronisasi...
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="23 4 23 10 17 10" />
					<polyline points="1 20 1 14 7 14" />
					<path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
				</svg>
				Sinkronisasi
			{/if}
		</Button>
		<Button
			class="flex-1 sm:flex-none"
			onclick={() => {
				showAddBoardForm = !showAddBoardForm;
				boardAddError = '';
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
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

					<!-- Toggle switch -->
					<button
						type="button"
						role="switch"
						aria-checked={board.isActive}
						aria-label="Toggle aktif {board.name}"
						onclick={() => handleToggleActive(board)}
						class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none {board.isActive
							? 'bg-accent'
							: 'bg-surface-2 ring-1 ring-border'}"
					>
						<span
							class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform {board.isActive
								? 'translate-x-4'
								: 'translate-x-0'}"
						></span>
					</button>

					<!-- Three-dot menu -->
					<DropdownMenu>
						{#snippet trigger()}
							<button
								type="button"
								aria-label="Menu {board.name}"
								class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<circle cx="12" cy="5" r="1" />
									<circle cx="12" cy="12" r="1" />
									<circle cx="12" cy="19" r="1" />
								</svg>
							</button>
						{/snippet}
						<DropdownMenuItem onclick={() => startEditBoard(board)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-muted"
							>
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
								<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
							</svg>
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="danger"
							separator
							onclick={() => (deletingBoard = { id: board._id, name: board.name })}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
								<path d="M10 11v6" />
								<path d="M14 11v6" />
								<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
							</svg>
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
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
