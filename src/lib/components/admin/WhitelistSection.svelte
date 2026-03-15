<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/api';
	import { extractError } from '$lib/utils';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { Plus, Search, Trash2, CircleAlert, X, Info } from 'lucide-svelte';

	const client = useConvexClient();
	const whitelistQuery = useQuery(api.whitelist.list, {});

	const entries = $derived(whitelistQuery.data ?? []);
	const isLoading = $derived(whitelistQuery.isLoading);

	let newName = $state('');
	let newEmail = $state('');
	let addError = $state('');
	let isAdding = $state(false);
	let confirmDeleteId = $state<string | null>(null);
	let deleteError = $state<string | null>(null);
	let search = $state('');

	const filteredEntries = $derived(
		entries.filter(
			(e) =>
				e.name.toLowerCase().includes(search.toLowerCase()) ||
				e.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const isFormValid = $derived(newName.trim().length > 0 && EMAIL_REGEX.test(newEmail.trim()));

	function formatShortDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function handleAdd() {
		if (!isFormValid || isAdding) return;
		isAdding = true;
		addError = '';
		try {
			await client.mutation(api.whitelist.add, { email: newEmail.trim(), name: newName.trim() });
			newName = '';
			newEmail = '';
		} catch (err) {
			addError = extractError(err, 'Gagal menambahkan email. Coba lagi.');
		} finally {
			isAdding = false;
		}
	}

	async function handleDelete(id: string) {
		deleteError = null;
		try {
			await client.mutation(api.whitelist.remove, { id: id as never });
			confirmDeleteId = null;
		} catch (err) {
			confirmDeleteId = null;
			deleteError = extractError(err, 'Gagal menghapus email. Coba lagi.');
		}
	}

	function handleAddKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && isFormValid) handleAdd();
	}
</script>

<!-- Add email form -->
<div class="mb-6 rounded-2xl border border-border bg-surface p-5">
	<p class="mb-4 text-sm font-semibold text-foreground">Tambah Email Baru</p>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onkeydown={handleAddKeydown} class="flex flex-col gap-3">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div>
				<label for="new-name" class="mb-1.5 block text-xs font-medium text-muted">Nama</label>
				<Input id="new-name" bind:value={newName} placeholder="Nama lengkap" disabled={isAdding} />
			</div>
			<div>
				<label for="new-email" class="mb-1.5 block text-xs font-medium text-muted">Email</label>
				<Input
					id="new-email"
					type="email"
					bind:value={newEmail}
					placeholder="nama@perusahaan.com"
					disabled={isAdding}
				/>
			</div>
		</div>

		{#if addError}
			<p class="text-xs text-danger">{addError}</p>
		{/if}

		<div class="flex justify-end">
			<Button disabled={!isFormValid} loading={isAdding} onclick={handleAdd}>
				<Plus />
				Tambah Email
			</Button>
		</div>
	</div>
</div>

<!-- Search -->
<div class="relative mb-4">
	<Search size={15} class="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
	<input
		type="text"
		bind:value={search}
		placeholder="Cari nama atau email..."
		class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pr-4 pl-10 text-sm text-foreground transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:outline-none"
	/>
</div>

<!-- Table -->
{#if isLoading}
	<div class="flex flex-col gap-2">
		{#each [1, 2, 3] as i (i)}
			<div class="h-14 animate-pulse rounded-xl bg-surface"></div>
		{/each}
	</div>
{:else if filteredEntries.length === 0}
	<div class="rounded-xl border border-border bg-surface py-16 text-center">
		<p class="text-sm text-muted">
			{search ? 'Tidak ada email yang cocok.' : 'Belum ada email terdaftar.'}
		</p>
		{#if search}
			<button
				type="button"
				onclick={() => (search = '')}
				class="mt-2 text-xs text-accent hover:underline"
			>
				Reset pencarian
			</button>
		{/if}
	</div>
{:else}
	<div class="overflow-hidden rounded-xl border border-border bg-surface">
		<div
			class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-border bg-surface-2 px-4 py-2.5"
		>
			<span class="text-xs font-semibold tracking-wider text-muted uppercase">Nama</span>
			<span class="text-xs font-semibold tracking-wider text-muted uppercase">Email</span>
			<span class="text-xs font-semibold tracking-wider text-muted uppercase">Ditambahkan</span>
			<span></span>
		</div>

		{#each filteredEntries as entry (entry._id)}
			<div
				class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2"
			>
				<span class="truncate text-sm font-medium text-foreground">{entry.name}</span>
				<span class="truncate text-sm text-muted">{entry.email}</span>
				<span class="text-xs whitespace-nowrap text-muted">{formatShortDate(entry.addedAt)}</span>

				{#if confirmDeleteId === entry._id}
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => handleDelete(entry._id)}
							class="rounded px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
						>
							Hapus
						</button>
						<button
							type="button"
							onclick={() => (confirmDeleteId = null)}
							class="rounded px-2 py-1 text-xs text-muted transition-colors hover:text-foreground"
						>
							Batal
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (confirmDeleteId = entry._id)}
						aria-label="Hapus {entry.name}"
						class="rounded p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
					>
						<Trash2 size={15} />
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<p class="mt-3 text-xs text-muted">
		Menampilkan {filteredEntries.length} dari {entries.length} email terdaftar.
	</p>
{/if}

<!-- Delete error -->
{#if deleteError}
	<div
		class="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3"
	>
		<CircleAlert size={14} class="mt-0.5 shrink-0 text-danger" />
		<p class="flex-1 text-xs leading-relaxed text-danger/90">{deleteError}</p>
		<button
			type="button"
			onclick={() => (deleteError = null)}
			class="shrink-0 text-danger/60 hover:text-danger"
			aria-label="Tutup"
		>
			<X size={13} />
		</button>
	</div>
{/if}

<!-- Info note -->
<div class="mt-6 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
	<Info size={14} class="mt-0.5 shrink-0 text-muted" />
	<p class="text-xs leading-relaxed text-muted">
		Hanya email yang terdaftar di sini yang bisa mengakses Mini Issues. Admin ditentukan lewat
		environment variable <code class="rounded bg-surface-2 px-1 py-0.5 font-mono text-accent"
			>ADMIN_EMAILS</code
		>
		dan tidak perlu didaftarkan di sini.
	</p>
</div>
