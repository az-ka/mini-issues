<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { FileText, ExternalLink, Upload, Play, X } from 'lucide-svelte';

	interface SavedAttachment {
		name: string;
		url: string;
	}

	interface Props {
		attachments: File[];
		savedAttachments?: SavedAttachment[];
		disabled?: boolean;
		accept?: string;
		hint?: string;
	}

	let {
		attachments = $bindable([]),
		savedAttachments = [],
		disabled = false,
		accept = 'image/*,video/mp4,video/quicktime',
		hint = 'JPG, PNG, GIF, MP4, MOV'
	}: Props = $props();

	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const MAX_FILES = 5;

	let isDragging = $state(false);
	let previewFile = $state<File | null>(null);
	let previewUrl = $state('');

	function isImage(file: File) {
		return file.type.startsWith('image/');
	}

	function isVideo(file: File) {
		return file.type.startsWith('video/');
	}

	function addFiles(files: File[]) {
		const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
		if (oversized.length > 0) {
			toast.error(`File terlalu besar (maks 10MB): ${oversized.map((f) => f.name).join(', ')}`);
		}
		const valid = files.filter((f) => f.size <= MAX_FILE_SIZE);
		const combined = [...attachments, ...valid];
		if (combined.length > MAX_FILES) {
			toast.warning(`Maksimal ${MAX_FILES} file. Beberapa file tidak ditambahkan.`);
		}
		attachments = combined.slice(0, MAX_FILES);
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;
		addFiles(Array.from(input.files));
		input.value = '';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
	}

	function removeAttachment(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	function openPreview(file: File) {
		previewFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	function closePreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewFile = null;
		previewUrl = '';
	}
</script>

<!-- Read-only: show saved attachments (already sent to Trello) -->
{#if disabled && savedAttachments.length > 0}
	<p class="mb-1.5 text-sm font-medium text-foreground">
		Attachment
		<span class="ml-1 text-xs font-normal text-muted">(tersimpan di Trello)</span>
	</p>
	<div class="flex flex-col gap-2">
		{#each savedAttachments as att (att.url)}
			<a
				href={att.url}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40"
			>
				<FileText size={14} class="shrink-0 text-muted" />
				<span class="min-w-0 flex-1 truncate text-xs text-foreground">{att.name}</span>
				<ExternalLink size={12} class="shrink-0 text-muted" />
			</a>
		{/each}
	</div>

	<!-- Upload mode -->
{:else if !disabled}
	<p class="mb-1.5 text-sm font-medium text-foreground">
		Attachment
		<span class="ml-1 text-xs font-normal text-muted">(opsional, maks {MAX_FILES} file @ 10MB)</span
		>
	</p>

	<!-- Drop zone -->
	<button
		type="button"
		class="w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors {isDragging
			? 'border-accent bg-accent/5'
			: 'border-border hover:border-accent/40 hover:bg-surface'}"
		ondragover={(e) => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
		onclick={() => document.getElementById('attachment-file-input')?.click()}
	>
		<Upload size={24} class="mx-auto mb-2 text-muted" />
		<p class="text-sm text-muted">
			Drag & drop atau <span class="text-accent">pilih file</span>
		</p>
		<p class="mt-1 text-xs text-muted/60">{hint}</p>
	</button>

	<input
		id="attachment-file-input"
		type="file"
		multiple
		{accept}
		class="hidden"
		onchange={handleFileInput}
	/>

	{#if attachments.length > 0}
		<div class="mt-3 flex flex-col gap-2">
			{#each attachments as file, i (i)}
				<div class="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
					<!-- Thumbnail / icon -->
					<button
						type="button"
						onclick={() => openPreview(file)}
						class="shrink-0 cursor-pointer"
						aria-label="Preview {file.name}"
					>
						{#if isImage(file)}
							<img
								src={URL.createObjectURL(file)}
								alt={file.name}
								class="h-9 w-9 rounded object-cover ring-1 ring-border"
							/>
						{:else if isVideo(file)}
							<div
								class="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-muted ring-1 ring-border"
							>
								<Play size={16} />
							</div>
						{:else}
							<div
								class="flex h-9 w-9 items-center justify-center rounded bg-surface-2 text-muted ring-1 ring-border"
							>
								<FileText size={14} />
							</div>
						{/if}
					</button>

					<!-- File name + size -->
					<button
						type="button"
						onclick={() => openPreview(file)}
						class="min-w-0 flex-1 cursor-pointer text-left"
						aria-label="Preview {file.name}"
					>
						<span class="block truncate text-xs text-foreground transition-colors hover:text-accent"
							>{file.name}</span
						>
						<span class="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
					</button>

					<!-- Remove -->
					<button
						type="button"
						aria-label="Hapus attachment {file.name}"
						onclick={() => removeAttachment(i)}
						class="shrink-0 cursor-pointer rounded p-0.5 text-muted transition-colors hover:text-danger"
					>
						<X size={14} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<!-- File preview modal -->
{#if previewFile}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Preview {previewFile.name}"
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			onclick={closePreview}
			aria-label="Tutup preview"
		></button>

		<div
			class="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<p class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
					{previewFile.name}
				</p>
				<button
					type="button"
					onclick={closePreview}
					class="ml-3 shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
					aria-label="Tutup"
				>
					<X size={16} />
				</button>
			</div>

			<div class="flex flex-1 items-center justify-center overflow-auto p-4">
				{#if isImage(previewFile)}
					<img
						src={previewUrl}
						alt={previewFile.name}
						class="max-h-[70dvh] max-w-full rounded-lg object-contain"
					/>
				{:else if isVideo(previewFile)}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video src={previewUrl} controls class="max-h-[70dvh] max-w-full rounded-lg"></video>
				{/if}
			</div>
		</div>
	</div>
{/if}
