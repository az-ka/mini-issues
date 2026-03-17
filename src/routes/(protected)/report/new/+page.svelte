<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { api } from '$convex/api';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import AttachmentUploader from '$lib/components/AttachmentUploader.svelte';
	import { Bug, Sparkles, Zap, CircleAlert, CircleDot, CircleArrowDown } from 'lucide-svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';
	type Frequency = 'selalu' | 'kadang' | 'sekali';

	const client = useConvexClient();
	const ctx = useClerkContext();
	const boardsQuery = useQuery(api.trelloBoards.listActive, () => ({}));
	const activeBoards = $derived(boardsQuery.data ?? []);
	const hasBoards = $derived(activeBoards.length > 0);

	const reporterName = $derived(ctx.clerk?.user?.fullName ?? ctx.clerk?.user?.firstName ?? '');

	// Form fields
	let title = $state('');
	let type = $state<TicketType>('bug');
	let priority = $state<Priority>('medium');
	let module = $state('');
	let description = $state('');
	let stepsToReproduce = $state('');
	let expectedResult = $state('');
	let actualResult = $state('');
	let frequency = $state<Frequency>('selalu');
	let businessImpact = $state('');
	let selectedBoardId = $state('');

	let attachments = $state<File[]>([]);

	// Submission state
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let savedReportId = $state(''); // saved after Convex mutation so Trello can retry

	const isBug = $derived(type === 'bug');

	// Auto-select when only one board exists
	$effect(() => {
		if (activeBoards.length === 1 && !selectedBoardId) {
			selectedBoardId = activeBoards[0]._id;
		}
	});

	// Icon mapping for types
	const typeOptions = [
		{ value: 'bug', label: 'Bug', icon: Bug },
		{ value: 'feature', label: 'Fitur', icon: Sparkles },
		{ value: 'improvement', label: 'Peningkatan', icon: Zap }
	];

	// Icon mapping for priorities
	const priorityOptions = [
		{ value: 'high', label: 'Tinggi', icon: CircleAlert, color: 'text-danger' },
		{ value: 'medium', label: 'Sedang', icon: CircleDot, color: 'text-warning' },
		{ value: 'low', label: 'Rendah', icon: CircleArrowDown, color: 'text-success' }
	];

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isSubmitting || !title.trim()) return;
		isSubmitting = true;
		errorMessage = '';

		try {
			// Step 1: Create report in Convex (skipped on retry if already saved)
			if (!savedReportId) {
				const id = await client.mutation(api.reports.createManual, {
					title: title.trim(),
					type,
					priority,
					module: module.trim() || undefined,
					description: description.trim() || undefined,
					stepsToReproduce: isBug && stepsToReproduce.trim() ? stepsToReproduce.trim() : undefined,
					expectedResult: isBug && expectedResult.trim() ? expectedResult.trim() : undefined,
					actualResult: isBug && actualResult.trim() ? actualResult.trim() : undefined,
					frequency: isBug ? frequency : undefined,
					businessImpact: businessImpact.trim() || undefined
				});
				savedReportId = id as string;
			}

			// Step 2: Send to Trello
			const fd = new FormData();
			fd.append('reportId', savedReportId);
			fd.append('title', title.trim());
			fd.append('type', type);
			fd.append('priority', priority);
			if (module.trim()) fd.append('module', module.trim());
			if (description.trim()) fd.append('description', description.trim());
			if (isBug && stepsToReproduce.trim()) fd.append('stepsToReproduce', stepsToReproduce.trim());
			if (isBug && expectedResult.trim()) fd.append('expectedResult', expectedResult.trim());
			if (isBug && actualResult.trim()) fd.append('actualResult', actualResult.trim());
			if (isBug) fd.append('frequency', frequency);
			if (businessImpact.trim()) fd.append('businessImpact', businessImpact.trim());
			if (reporterName) fd.append('reporterName', reporterName);
			if (selectedBoardId) fd.append('boardId', selectedBoardId);
			for (const file of attachments) fd.append('attachments', file);

			const res = await fetch('/api/trello', { method: 'POST', body: fd });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || 'Gagal mengirim ke Trello.');
			}

			goto(`/ticket/${savedReportId}`);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
			isSubmitting = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl px-4 pt-6 pb-16">
	<PageHeader title="Buat Laporan Manual" backHref="/dashboard" />
	<p class="-mt-4 mb-6 text-sm text-muted">
		Isi formulir di bawah untuk membuat laporan tanpa bantuan AI.
	</p>

	<form onsubmit={handleSubmit} class="mt-6 space-y-6">
		<!-- Title -->
		<div>
			<label for="title" class="mb-1.5 block text-sm font-medium text-foreground">
				Judul <span class="text-danger">*</span>
			</label>
			<Input
				id="title"
				bind:value={title}
				placeholder="Ringkasan singkat masalah atau permintaan..."
				disabled={isSubmitting}
			/>
		</div>

		<!-- Type + Priority (side by side) -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
			<!-- Type -->
			<fieldset>
				<legend class="mb-2 text-sm font-medium text-foreground">
					Tipe <span class="text-danger">*</span>
				</legend>
				<div class="flex flex-wrap gap-2">
					{#each typeOptions as opt (opt.value)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors {type ===
							opt.value
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border text-muted hover:border-accent/40'}"
						>
							<input
								type="radio"
								name="type"
								value={opt.value}
								bind:group={type}
								class="sr-only"
								disabled={isSubmitting}
							/>
							<opt.icon size={15} />
							{opt.label}
						</label>
					{/each}
				</div>
			</fieldset>

			<!-- Priority -->
			<fieldset>
				<legend class="mb-2 text-sm font-medium text-foreground">Prioritas</legend>
				<div class="flex flex-wrap gap-2">
					{#each priorityOptions as opt (opt.value)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors {priority ===
							opt.value
								? 'border-accent bg-accent/10 text-accent'
								: 'border-border text-muted hover:border-accent/40'}"
						>
							<input
								type="radio"
								name="priority"
								value={opt.value}
								bind:group={priority}
								class="sr-only"
								disabled={isSubmitting}
							/>
							<opt.icon size={15} class={priority === opt.value ? 'text-accent' : opt.color} />
							{opt.label}
						</label>
					{/each}
				</div>
			</fieldset>
		</div>

		<!-- Module -->
		<div>
			<label for="module" class="mb-1.5 block text-sm font-medium text-foreground">
				Modul / Fitur
			</label>
			<Input
				id="module"
				bind:value={module}
				placeholder="Contoh: Dashboard, Auth, Laporan..."
				disabled={isSubmitting}
			/>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="mb-1.5 block text-sm font-medium text-foreground">
				Deskripsi
			</label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder="Jelaskan masalah atau permintaan secara detail..."
				rows={4}
				disabled={isSubmitting}
			/>
		</div>

		<!-- Bug-only fields -->
		{#if isBug}
			<div class="space-y-4 rounded-xl border border-border p-4">
				<p class="text-xs font-semibold tracking-wide text-muted uppercase">Detail Bug</p>

				<div>
					<label for="steps" class="mb-1.5 block text-sm font-medium text-foreground">
						Langkah Reproduksi
					</label>
					<Textarea
						id="steps"
						bind:value={stepsToReproduce}
						placeholder="1. Buka halaman...\n2. Klik tombol...\n3. Lihat error..."
						rows={3}
						disabled={isSubmitting}
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="expected" class="mb-1.5 block text-sm font-medium text-foreground">
							Hasil yang Diharapkan
						</label>
						<Textarea
							id="expected"
							bind:value={expectedResult}
							placeholder="Seharusnya..."
							rows={2}
							disabled={isSubmitting}
						/>
					</div>
					<div>
						<label for="actual" class="mb-1.5 block text-sm font-medium text-foreground">
							Hasil Aktual
						</label>
						<Textarea
							id="actual"
							bind:value={actualResult}
							placeholder="Yang terjadi adalah..."
							rows={2}
							disabled={isSubmitting}
						/>
					</div>
				</div>

				<fieldset>
					<legend class="mb-2 text-sm font-medium text-foreground">Frekuensi</legend>
					<div class="flex flex-wrap gap-2">
						{#each [{ value: 'selalu', label: 'Selalu' }, { value: 'kadang', label: 'Kadang-kadang' }, { value: 'sekali', label: 'Sekali' }] as opt (opt.value)}
							<label
								class="cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors {frequency ===
								opt.value
									? 'border-accent bg-accent/10 text-accent'
									: 'border-border text-muted hover:border-accent/40'}"
							>
								<input
									type="radio"
									name="frequency"
									value={opt.value}
									bind:group={frequency}
									class="sr-only"
									disabled={isSubmitting}
								/>
								{opt.label}
							</label>
						{/each}
					</div>
				</fieldset>
			</div>
		{/if}

		<!-- Business Impact -->
		<div>
			<label for="impact" class="mb-1.5 block text-sm font-medium text-foreground">
				Dampak Bisnis
			</label>
			<Textarea
				id="impact"
				bind:value={businessImpact}
				placeholder="Bagaimana ini mempengaruhi pengguna atau operasional?"
				rows={2}
				disabled={isSubmitting}
			/>
		</div>

		<!-- Attachments -->
		<div>
			<AttachmentUploader
				bind:attachments
				accept="image/*,.pdf,.txt,.log"
				hint="JPG, PNG, PDF, TXT, LOG"
				disabled={isSubmitting}
			/>
		</div>

		<!-- Board selection -->
		<div>
			<p class="mb-2 text-sm font-medium text-foreground">Board Trello</p>
			{#if boardsQuery.isLoading}
				<p class="text-sm text-muted">Memuat board...</p>
			{:else if !hasBoards}
				<div class="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
					⚠️ Belum ada board Trello yang aktif. Hubungi admin untuk mengkonfigurasi board.
				</div>
			{:else if activeBoards.length === 1}
				<div class="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
					<span class="font-medium">{activeBoards[0].name}</span>
					<span class="ml-2 text-xs text-muted">(satu-satunya board aktif)</span>
				</div>
			{:else}
				<select
					bind:value={selectedBoardId}
					disabled={isSubmitting}
					class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
				>
					<option value="" disabled>Pilih board...</option>
					{#each activeBoards as board (board._id)}
						<option value={board._id}>{board.name}</option>
					{/each}
				</select>
			{/if}
		</div>

		<!-- Error message -->
		{#if errorMessage}
			<div class="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
				⚠️ {errorMessage}
				{#if savedReportId}
					<span class="mt-1 block text-xs text-muted">
						Laporan sudah dibuat. Klik "Kirim ke Trello" lagi untuk mencoba ulang.
					</span>
				{/if}
				<button
					type="button"
					onclick={() => (errorMessage = '')}
					class="ml-2 underline hover:no-underline">Tutup</button
				>
			</div>
		{/if}

		<!-- Actions -->
		{#if hasBoards}
			<Button
				type="submit"
				size="lg"
				class="w-full"
				loading={isSubmitting}
				disabled={isSubmitting || !title.trim() || (!selectedBoardId && activeBoards.length > 1)}
			>
				Kirim ke Trello
			</Button>
		{/if}
	</form>
</div>
