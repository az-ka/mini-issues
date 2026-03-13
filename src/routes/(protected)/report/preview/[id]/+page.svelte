<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { api } from '../../../../../convex/_generated/api';
	import type { Id } from '../../../../../convex/_generated/dataModel';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';
	type Frequency = 'selalu' | 'kadang' | 'sekali';

	const reportId = $derived(page.params.id as Id<'reports'>);
	const reportQuery = useQuery(api.reports.getDraft, () => ({ id: reportId }));

	const ctx = useClerkContext();
	const reporterName = $derived(ctx.clerk?.user?.fullName ?? ctx.clerk?.user?.firstName ?? 'Kamu');
	const reportDate = $derived(
		reportQuery.data
			? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
					new Date(reportQuery.data.createdAt)
				)
			: '-'
	);

	let title = $state('');
	let type = $state<TicketType>('bug');
	let priority = $state<Priority>('medium');
	let description = $state('');
	let steps = $state('');
	let expected = $state('');
	let actual = $state('');
	let module = $state('');
	let frequency = $state<Frequency>('selalu');
	let impact = $state('');

	let attachments = $state<File[]>([]);
	let isDragging = $state(false);
	let populated = $state(false);

	const FREQ_MAP: Record<string, Frequency> = {
		Selalu: 'selalu',
		'Kadang-kadang': 'kadang',
		Sekali: 'sekali'
	};

	// Populate form fields once the report loads
	$effect(() => {
		const data = reportQuery.data;
		if (!data || populated) return;
		populated = true;

		title = data.title ?? '';
		type = (data.type as TicketType) ?? 'bug';
		priority = (data.priority as Priority) ?? 'medium';
		module = data.module ?? '';
		description = data.description ?? '';
		steps = data.stepsToReproduce ?? '';
		expected = data.expectedResult ?? '';
		actual = data.actualResult ?? '';
		frequency = FREQ_MAP[data.frequency ?? ''] ?? 'selalu';
		impact = data.businessImpact ?? '';
	});

	const isBug = $derived(type === 'bug');

	const typeOptions: { value: TicketType; label: string }[] = [
		{ value: 'bug', label: 'Bug' },
		{ value: 'feature', label: 'Feature Request' },
		{ value: 'improvement', label: 'Improvement' }
	];

	const priorityOptions: { value: Priority; label: string; color: string }[] = [
		{ value: 'high', label: 'High', color: 'text-danger' },
		{ value: 'medium', label: 'Medium', color: 'text-warning' },
		{ value: 'low', label: 'Low', color: 'text-success' }
	];

	const frequencyOptions: { value: Frequency; label: string }[] = [
		{ value: 'selalu', label: 'Selalu terjadi' },
		{ value: 'kadang', label: 'Kadang-kadang' },
		{ value: 'sekali', label: 'Hanya sekali' }
	];

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;
		addFiles(Array.from(input.files));
	}

	function addFiles(files: File[]) {
		const valid = files.filter((f) => f.size <= 10 * 1024 * 1024);
		attachments = [...attachments, ...valid].slice(0, 5);
	}

	function removeAttachment(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<PageHeader title="Preview & Edit Tiket" backHref="/report/chat" backLabel="Kembali ke Chat" />

	{#if reportQuery.isLoading}
		<div class="flex flex-col gap-3 pt-4">
			{#each [1, 2, 3, 4] as _}
				<div class="h-10 animate-pulse rounded-xl bg-surface-2"></div>
			{/each}
		</div>
	{:else if !reportQuery.data}
		<div class="rounded-xl border border-danger/20 bg-danger/5 px-4 py-6 text-center text-sm text-danger">
			Draft tiket tidak ditemukan atau kamu tidak punya akses ke tiket ini.
		</div>
	{:else}
	<p class="mb-6 text-sm text-muted">
		Periksa dan edit tiket di bawah sebelum dikirim ke Trello. Semua field bisa diubah.
	</p>

	<div class="flex flex-col gap-5">

		<!-- Judul -->
		<div>
			<label for="title" class="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
				Judul
				<span class="text-xs text-muted">{title.length}/80</span>
			</label>
			<Input id="title" bind:value={title} placeholder="Ringkasan singkat masalah" />
		</div>

		<!-- Tipe & Prioritas -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="mb-1.5 text-sm font-medium text-foreground">Tipe</p>
				<div class="flex flex-col gap-1.5">
					{#each typeOptions as opt}
						<label class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors {type === opt.value ? 'border-accent/40 bg-accent/8 text-foreground' : 'border-border bg-surface text-muted hover:border-border/80 hover:text-foreground'}">
							<input type="radio" bind:group={type} value={opt.value} class="accent-accent" />
							{opt.label}
						</label>
					{/each}
				</div>
			</div>

			<div>
				<p class="mb-1.5 text-sm font-medium text-foreground">Prioritas</p>
				<div class="flex flex-col gap-1.5">
					{#each priorityOptions as opt}
						<label class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors {priority === opt.value ? 'border-accent/40 bg-accent/8 text-foreground' : 'border-border bg-surface text-muted hover:border-border/80 hover:text-foreground'}">
							<input type="radio" bind:group={priority} value={opt.value} class="accent-accent" />
							<span class={opt.color}>{opt.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</div>

		<!-- Halaman / Modul -->
		<div>
			<label for="module" class="mb-1.5 block text-sm font-medium text-foreground">Halaman / Modul</label>
			<Input id="module" bind:value={module} placeholder="Contoh: Halaman Login, Dashboard, dll." />
		</div>

		<!-- Deskripsi -->
		<div>
			<label for="description" class="mb-1.5 block text-sm font-medium text-foreground">Deskripsi</label>
			<Textarea id="description" bind:value={description} rows={4} placeholder="Penjelasan lengkap masalah atau request" />
		</div>

		<!-- Bug-only fields -->
		{#if isBug}
			<div class="rounded-xl border border-border bg-surface p-4">
				<div class="mb-1 flex items-center gap-2">
					<Badge color="red">Bug</Badge>
					<span class="text-xs text-muted">Field khusus untuk laporan bug</span>
				</div>

				<div class="mt-4 flex flex-col gap-4">
					<!-- Steps to Reproduce -->
					<div>
						<label for="steps" class="mb-1.5 block text-sm font-medium text-foreground">Steps to Reproduce</label>
						<Textarea id="steps" bind:value={steps} rows={4} placeholder="Langkah-langkah untuk mereproduksi bug" />
					</div>

					<!-- Expected vs Actual -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="expected" class="mb-1.5 block text-sm font-medium text-foreground">Expected Behavior</label>
							<Textarea id="expected" bind:value={expected} rows={3} placeholder="Yang seharusnya terjadi" />
						</div>
						<div>
							<label for="actual" class="mb-1.5 block text-sm font-medium text-foreground">Actual Behavior</label>
							<Textarea id="actual" bind:value={actual} rows={3} placeholder="Yang sebenarnya terjadi" />
						</div>
					</div>

					<!-- Frekuensi -->
					<div>
						<p class="mb-1.5 text-sm font-medium text-foreground">Frekuensi</p>
						<div class="flex flex-wrap gap-2">
							{#each frequencyOptions as opt}
								<label class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors {frequency === opt.value ? 'border-accent/40 bg-accent/8 text-foreground' : 'border-border bg-surface text-muted hover:text-foreground'}">
									<input type="radio" bind:group={frequency} value={opt.value} class="accent-accent" />
									{opt.label}
								</label>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Dampak Bisnis -->
		<div>
			<label for="impact" class="mb-1.5 block text-sm font-medium text-foreground">Dampak Bisnis</label>
			<Textarea id="impact" bind:value={impact} rows={3} placeholder="Seberapa besar pengaruhnya ke operasional?" />
		</div>

		<!-- Attachments -->
		<div>
			<p class="mb-1.5 text-sm font-medium text-foreground">
				Attachment
				<span class="ml-1 text-xs font-normal text-muted">(opsional, maks 5 file @ 10MB)</span>
			</p>

			<!-- Drop zone -->
			<button
				type="button"
				class="w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors {isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-surface'}"
				ondragover={(e) => { e.preventDefault(); isDragging = true; }}
				ondragleave={() => (isDragging = false)}
				ondrop={handleDrop}
				onclick={() => document.getElementById('file-input')?.click()}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-muted">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				<p class="text-sm text-muted">
					Drag & drop atau <span class="text-accent">pilih file</span>
				</p>
				<p class="mt-1 text-xs text-muted/60">JPG, PNG, GIF, MP4, MOV</p>
			</button>

			<input id="file-input" type="file" multiple accept="image/*,video/mp4,video/quicktime" class="hidden" onchange={handleFileInput} />

			{#if attachments.length > 0}
				<div class="mt-3 flex flex-col gap-2">
					{#each attachments as file, i}
						<div class="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted">
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
								<polyline points="14 2 14 8 20 8" />
							</svg>
							<span class="min-w-0 flex-1 truncate text-xs text-foreground">{file.name}</span>
							<span class="shrink-0 text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
							<button type="button" aria-label="Hapus attachment {file.name}" onclick={() => removeAttachment(i)} class="shrink-0 rounded p-0.5 text-muted transition-colors hover:text-danger">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Reporter info (read-only) -->
		<div class="rounded-xl border border-border bg-surface px-4 py-3">
			<div class="flex flex-wrap items-center gap-x-6 gap-y-1.5">
				<div class="flex items-center gap-2">
					<span class="text-xs text-muted">Dilaporkan oleh</span>
					<span class="text-xs font-medium text-foreground">{reporterName}</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-xs text-muted">Tanggal</span>
					<span class="text-xs font-medium text-foreground">{reportDate}</span>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-3 pt-2 pb-8">
			<Button size="lg" class="w-full">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				Kirim ke Trello
			</Button>
			<a href="/report/chat" class="text-center text-sm text-muted transition-colors hover:text-foreground">
				← Kembali ke Chat
			</a>
		</div>

	</div>
	{/if}
</div>
