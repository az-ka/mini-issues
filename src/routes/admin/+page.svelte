<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	interface WhitelistEntry {
		id: string;
		name: string;
		email: string;
		addedAt: string;
	}

	let entries = $state<WhitelistEntry[]>([
		{ id: '1', name: 'Rina Wulandari', email: 'rina@perusahaan.com', addedAt: '1 Jan 2025' },
		{ id: '2', name: 'Budi Santoso', email: 'budi@perusahaan.com', addedAt: '3 Jan 2025' },
		{ id: '3', name: 'Siti Rahayu', email: 'siti@perusahaan.com', addedAt: '10 Jan 2025' },
		{ id: '4', name: 'Agus Permana', email: 'agus@perusahaan.com', addedAt: '15 Jan 2025' },
		{ id: '5', name: 'Dewi Kusuma', email: 'dewi@perusahaan.com', addedAt: '20 Feb 2025' }
	]);

	let newName = $state('');
	let newEmail = $state('');
	let confirmDeleteId = $state<string | null>(null);
	let search = $state('');

	const filteredEntries = $derived(
		entries.filter(
			(e) =>
				e.name.toLowerCase().includes(search.toLowerCase()) ||
				e.email.toLowerCase().includes(search.toLowerCase())
		)
	);

	function addEntry() {
		if (!newName.trim() || !newEmail.trim()) return;
		entries = [
			...entries,
			{
				id: crypto.randomUUID(),
				name: newName.trim(),
				email: newEmail.trim(),
				addedAt: new Date().toLocaleDateString('id-ID', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})
			}
		];
		newName = '';
		newEmail = '';
	}

	function deleteEntry(id: string) {
		entries = entries.filter((e) => e.id !== id);
		confirmDeleteId = null;
	}

	const isFormValid = $derived(newName.trim().length > 0 && newEmail.trim().includes('@'));
</script>

<div class="mx-auto min-h-dvh max-w-2xl px-4 py-8">
	<PageHeader title="Admin — Whitelist Email" backHref="/dashboard" backLabel="Kembali ke Dashboard">
		{#snippet right()}
			<span
				class="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
			>
				{entries.length} email terdaftar
			</span>
		{/snippet}
	</PageHeader>

	<!-- Add email form -->
	<div class="mb-6 rounded-2xl border border-border bg-surface p-5">
		<p class="mb-4 text-sm font-semibold text-foreground">Tambah Email Baru</p>

		<div class="flex flex-col gap-3">
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div>
					<label for="new-name" class="mb-1.5 block text-xs font-medium text-muted">
						Nama
					</label>
					<Input
						id="new-name"
						bind:value={newName}
						placeholder="Nama lengkap"
					/>
				</div>
				<div>
					<label for="new-email" class="mb-1.5 block text-xs font-medium text-muted">
						Email
					</label>
					<Input
						id="new-email"
						type="email"
						bind:value={newEmail}
						placeholder="nama@perusahaan.com"
					/>
				</div>
			</div>

			<div class="flex justify-end">
				<Button disabled={!isFormValid} onclick={addEntry}>
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
					>
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					Tambah Email
				</Button>
			</div>
		</div>
	</div>

	<!-- Search -->
	<div class="relative mb-4">
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
			class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			type="text"
			bind:value={search}
			placeholder="Cari nama atau email..."
			class="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
		/>
	</div>

	<!-- Table -->
	{#if filteredEntries.length === 0}
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
			<!-- Table header -->
			<div
				class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-border bg-surface-2 px-4 py-2.5"
			>
				<span class="text-xs font-semibold uppercase tracking-wider text-muted">Nama</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-muted">Email</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-muted">Ditambahkan</span>
				<span class="text-xs font-semibold uppercase tracking-wider text-muted"></span>
			</div>

			<!-- Rows -->
			{#each filteredEntries as entry (entry.id)}
				<div
					class="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-surface-2"
				>
					<span class="truncate text-sm font-medium text-foreground">{entry.name}</span>
					<span class="truncate text-sm text-muted">{entry.email}</span>
					<span class="whitespace-nowrap text-xs text-muted">{entry.addedAt}</span>

					<!-- Delete -->
					{#if confirmDeleteId === entry.id}
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => deleteEntry(entry.id)}
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
							onclick={() => (confirmDeleteId = entry.id)}
							class="rounded p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
							aria-label="Hapus {entry.name}"
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
								<polyline points="3 6 5 6 21 6" />
								<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
								<path d="M10 11v6" />
								<path d="M14 11v6" />
								<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
							</svg>
						</button>
					{/if}
				</div>
			{/each}
		</div>

		<p class="mt-3 text-xs text-muted">
			Menampilkan {filteredEntries.length} dari {entries.length} email terdaftar.
		</p>
	{/if}

	<!-- Info note -->
	<div class="mt-6 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
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
			Hanya email yang terdaftar di sini yang bisa mengakses Mini Issues. Menghapus email akan
			mencabut akses pengguna tersebut saat login berikutnya.
		</p>
	</div>

	<div class="pb-8"></div>
</div>
