<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/api';
	import { extractError } from '$lib/utils';
	import BoardForm from '$lib/components/BoardForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
	import DropdownMenuItem from '$lib/components/ui/DropdownMenuItem.svelte';

	const client = useConvexClient();
	const boardsQuery = useQuery(api.trelloBoards.list, {});

	const boards = $derived(boardsQuery.data ?? []);

	let boardName = $state('');
	let boardBoardId = $state('');
	let boardListId = $state('');
	let boardAddError = $state('');
	let isAddingBoard = $state(false);
	let showAddBoardForm = $state(false);
	let confirmDeleteBoardId = $state<string | null>(null);
	let boardError = $state<string | null>(null);
	let editingBoardId = $state<string | null>(null);
	let editBoardName = $state('');
	let editBoardBoardId = $state('');
	let editBoardListId = $state('');

	async function handleAddBoard() {
		if (!boardName.trim() || !boardBoardId.trim() || !boardListId.trim() || isAddingBoard) return;
		isAddingBoard = true;
		boardAddError = '';
		try {
			await client.mutation(api.trelloBoards.add, {
				name: boardName.trim(),
				boardId: boardBoardId.trim(),
				listId: boardListId.trim(),
				isActive: true
			});
			boardName = '';
			boardBoardId = '';
			boardListId = '';
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
			confirmDeleteBoardId = null;
		} catch (err) {
			confirmDeleteBoardId = null;
			boardError = extractError(err, 'Gagal menghapus board. Coba lagi.');
		}
	}

	function startEditBoard(board: (typeof boards)[0]) {
		editingBoardId = board._id;
		editBoardName = board.name;
		editBoardBoardId = board.boardId;
		editBoardListId = board.listId;
	}

	async function handleToggleActive(board: (typeof boards)[0]) {
		try {
			await client.mutation(api.trelloBoards.update, {
				id: board._id as never,
				name: board.name,
				boardId: board.boardId,
				listId: board.listId,
				isActive: !board.isActive
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
				listId: editBoardListId.trim(),
				isActive: board.isActive
			});
			editingBoardId = null;
		} catch (err) {
			boardError = extractError(err, 'Gagal mengupdate board. Coba lagi.');
		}
	}
</script>

<!-- Section header -->
<div class="mb-4 flex items-start justify-between gap-3">
	<div>
		<h2 class="text-sm font-semibold text-foreground">Trello Boards</h2>
		<p class="mt-0.5 text-xs text-muted">
			{boards.length} board{boards.length !== 1 ? 's' : ''} terhubung
		</p>
	</div>
	<Button
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

<!-- Add board form (collapsible) -->
{#if showAddBoardForm}
	<div class="mb-4 rounded-2xl border border-accent/30 bg-surface p-5">
		<BoardForm
			bind:name={boardName}
			bind:boardId={boardBoardId}
			bind:listId={boardListId}
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
						<p class="mt-0.5 truncate font-mono text-xs text-muted">
							{board.boardId} · {board.listId}
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
						{#snippet children()}
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
							{#if confirmDeleteBoardId === board._id}
								<div class="border-t border-border px-3 py-2">
									<p class="mb-1.5 text-xs text-danger">Yakin hapus board ini?</p>
									<div class="flex gap-1.5">
										<button
											type="button"
											onclick={() => handleDeleteBoard(board._id)}
											class="rounded px-2 py-0.5 text-xs font-medium text-danger hover:bg-danger/10"
										>
											Ya, hapus
										</button>
										<button
											type="button"
											onclick={() => (confirmDeleteBoardId = null)}
											class="rounded px-2 py-0.5 text-xs text-muted hover:text-foreground"
										>
											Batal
										</button>
									</div>
								</div>
							{:else}
								<DropdownMenuItem
									variant="danger"
									separator
									onclick={() => (confirmDeleteBoardId = board._id)}
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
							{/if}
						{/snippet}
					</DropdownMenu>
				</div>

				<!-- Inline edit form (expands below row) -->
				{#if editingBoardId === board._id}
					<div class="border-t border-accent/20 bg-surface-2/40 px-4 py-4">
						<BoardForm
							bind:name={editBoardName}
							bind:boardId={editBoardBoardId}
							bind:listId={editBoardListId}
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

<!-- Info note -->
<div class="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="mt-0.5 shrink-0 text-muted"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="12" />
		<line x1="12" y1="16" x2="12.01" y2="16" />
	</svg>
	<p class="text-xs leading-relaxed text-muted">
		Board ID dari URL Trello: <code class="rounded bg-surface-2 px-1 py-0.5 font-mono text-accent"
			>trello.com/b/<strong>BoardID</strong>/nama</code
		>. List ID: buka board lalu tambahkan
		<code class="rounded bg-surface-2 px-1 py-0.5 font-mono text-accent">.json</code> di akhir URL.
	</p>
</div>
