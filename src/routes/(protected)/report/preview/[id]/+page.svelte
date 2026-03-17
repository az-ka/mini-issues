<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { toast } from 'svelte-sonner';
	import { api } from '$convex/api';
	import type { Id } from '$convex/dataModel';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import NotFound from '$lib/components/ui/NotFound.svelte';
	import AttachmentUploader from '$lib/components/AttachmentUploader.svelte';
	import { TriangleAlert, CircleCheckBig } from 'lucide-svelte';

	type TicketType = 'bug' | 'feature' | 'improvement';
	type Priority = 'high' | 'medium' | 'low';
	type Frequency = 'selalu' | 'kadang' | 'sekali';

	const reportId = $derived(page.params.id as Id<'reports'>);
	const reportQuery = useQuery(api.reports.getDraft, () => ({ id: reportId }));
	const boardsQuery = useQuery(api.trelloBoards.listActive, () => ({}));
	const activeBoards = $derived(boardsQuery.data ?? []);

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
	let isSending = $state(false);

	// Derived from Convex — already sent if trelloCardId exists
	const alreadySent = $derived(!!reportQuery.data?.trelloCardId);
	const savedAttachments = $derived<{ name: string; url: string }[]>(
		reportQuery.data?.attachmentUrls ? JSON.parse(reportQuery.data.attachmentUrls) : []
	);

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

	async function sendToTrello() {
		if (isSending || alreadySent) return;
		isSending = true;

		try {
			const form = new FormData();
			form.append('reportId', reportId);
			form.append('title', title);
			form.append('type', type);
			form.append('priority', priority);
			form.append('module', module);
			form.append('description', description);
			form.append('stepsToReproduce', steps);
			form.append('expectedResult', expected);
			form.append('actualResult', actual);
			form.append('frequency', frequency);
			form.append('businessImpact', impact);
			form.append('reporterName', reporterName);

			for (const file of attachments) {
				form.append('attachments', file, file.name);
			}

			const res = await fetch('/api/trello', { method: 'POST', body: form });

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || 'Gagal mengirim ke Trello.');
			}

			toast.success('Laporan berhasil dikirim ke Trello!');
			await goto(`/report/success/${reportId}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Gagal mengirim ke Trello. Coba lagi.');
		} finally {
			isSending = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<PageHeader title="Preview & Edit Laporan" backHref="/history" backLabel="Kembali" />

	{#if reportQuery.isLoading}
		<div class="flex flex-col gap-3 pt-4">
			{#each [1, 2, 3, 4] as _, i (i)}
				<div class="h-10 animate-pulse rounded-xl bg-surface-2"></div>
			{/each}
		</div>
	{:else if reportQuery.data}
		<p class="mb-6 text-sm text-muted">
			Periksa dan edit laporan di bawah sebelum dikirim ke Trello. Semua field bisa diubah.
		</p>

		<div class="flex flex-col gap-5">
			<!-- Judul -->
			<div>
				<label
					for="title"
					class="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground"
				>
					Judul
					<span class="text-xs text-muted">{title.length}/80</span>
				</label>
				<Input
					id="title"
					bind:value={title}
					placeholder="Ringkasan singkat masalah"
					disabled={alreadySent}
				/>
			</div>

			<!-- Tipe & Prioritas -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="mb-1.5 text-sm font-medium text-foreground">Tipe</p>
					<div class="flex flex-col gap-1.5">
						{#each typeOptions as opt (opt.value)}
							<label
								class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors {type ===
								opt.value
									? 'border-accent/40 bg-accent/8 text-foreground'
									: 'border-border bg-surface text-muted hover:border-border/80 hover:text-foreground'}"
							>
								<input
									type="radio"
									bind:group={type}
									value={opt.value}
									class="accent-accent"
									disabled={alreadySent}
								/>
								{opt.label}
							</label>
						{/each}
					</div>
				</div>

				<div>
					<p class="mb-1.5 text-sm font-medium text-foreground">Prioritas</p>
					<div class="flex flex-col gap-1.5">
						{#each priorityOptions as opt (opt.value)}
							<label
								class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors {priority ===
								opt.value
									? 'border-accent/40 bg-accent/8 text-foreground'
									: 'border-border bg-surface text-muted hover:border-border/80 hover:text-foreground'}"
							>
								<input
									type="radio"
									bind:group={priority}
									value={opt.value}
									class="accent-accent"
									disabled={alreadySent}
								/>
								<span class={opt.color}>{opt.label}</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<!-- Halaman / Modul -->
			<div>
				<label for="module" class="mb-1.5 block text-sm font-medium text-foreground"
					>Halaman / Modul</label
				>
				<Input
					id="module"
					bind:value={module}
					placeholder="Contoh: Halaman Login, Dashboard, dll."
					disabled={alreadySent}
				/>
			</div>

			<!-- Deskripsi -->
			<div>
				<label for="description" class="mb-1.5 block text-sm font-medium text-foreground"
					>Deskripsi</label
				>
				<Textarea
					id="description"
					bind:value={description}
					rows={4}
					placeholder="Penjelasan lengkap masalah atau request"
					disabled={alreadySent}
				/>
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
							<label for="steps" class="mb-1.5 block text-sm font-medium text-foreground"
								>Steps to Reproduce</label
							>
							<Textarea
								id="steps"
								bind:value={steps}
								rows={4}
								placeholder="Langkah-langkah untuk mereproduksi bug"
								disabled={alreadySent}
							/>
						</div>

						<!-- Expected vs Actual -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="expected" class="mb-1.5 block text-sm font-medium text-foreground"
									>Expected Behavior</label
								>
								<Textarea
									id="expected"
									bind:value={expected}
									rows={3}
									placeholder="Yang seharusnya terjadi"
									disabled={alreadySent}
								/>
							</div>
							<div>
								<label for="actual" class="mb-1.5 block text-sm font-medium text-foreground"
									>Actual Behavior</label
								>
								<Textarea
									id="actual"
									bind:value={actual}
									rows={3}
									placeholder="Yang sebenarnya terjadi"
									disabled={alreadySent}
								/>
							</div>
						</div>

						<!-- Frekuensi -->
						<div>
							<p class="mb-1.5 text-sm font-medium text-foreground">Frekuensi</p>
							<div class="flex flex-wrap gap-2">
								{#each frequencyOptions as opt (opt.value)}
									<label
										class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors {frequency ===
										opt.value
											? 'border-accent/40 bg-accent/8 text-foreground'
											: 'border-border bg-surface text-muted hover:text-foreground'}"
									>
										<input
											type="radio"
											bind:group={frequency}
											value={opt.value}
											class="accent-accent"
											disabled={alreadySent}
										/>
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
				<label for="impact" class="mb-1.5 block text-sm font-medium text-foreground"
					>Dampak Bisnis</label
				>
				<Textarea
					id="impact"
					bind:value={impact}
					rows={3}
					placeholder="Seberapa besar pengaruhnya ke operasional?"
					disabled={alreadySent}
				/>
			</div>

			<!-- Attachments: upload zone before sent, saved list after sent -->
			<div>
				<AttachmentUploader bind:attachments {savedAttachments} disabled={alreadySent} />
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
				<!-- Alert: no active boards configured -->
				{#if !alreadySent && !boardsQuery.isLoading && activeBoards.length === 0}
					<div
						class="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3"
					>
						<TriangleAlert size={14} class="mt-0.5 shrink-0 text-warning" />
						<p class="text-xs leading-relaxed text-warning">
							Belum ada board Trello yang aktif. Hubungi admin untuk mengkonfigurasi board terlebih
							dahulu.
						</p>
					</div>
				{/if}

				{#if !(!alreadySent && !boardsQuery.isLoading && activeBoards.length === 0)}
					<Button
						size="lg"
						class="w-full"
						onclick={sendToTrello}
						disabled={alreadySent}
						loading={isSending}
					>
						<CircleCheckBig />
						Kirim ke Trello
					</Button>
				{/if}
				<a
					href="/report/chat"
					class="text-center text-sm text-muted transition-colors hover:text-foreground"
				>
					← Kembali ke Chat
				</a>
			</div>
		</div>
	{/if}
</div>

<!-- Not found: full-page centered (shown when query resolves but data is null) -->
{#if !reportQuery.isLoading && !reportQuery.data}
	<NotFound
		title="Draft tidak ditemukan"
		message="Draft laporan ini tidak ada atau kamu tidak punya akses."
	/>
{/if}
