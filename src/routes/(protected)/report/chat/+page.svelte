<script lang="ts">
	import { tick } from 'svelte';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useClerkContext } from 'svelte-clerk/client';
	import { api } from '$convex/api';
	import type { Id } from '$convex/dataModel';
	import { getInitials } from '$lib/utils';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { ArrowRight, Send } from 'lucide-svelte';

	type Role = 'ai' | 'user';

	interface Message {
		id: number;
		role: Role;
		text: string;
	}

	interface TicketDraft {
		title: string;
		type: string;
		priority: string;
		module: string;
		description: string;
		stepsToReproduce?: string[] | null;
		expectedBehavior?: string | null;
		actualBehavior?: string | null;
		frequency?: string | null;
		businessImpact: string;
	}

	const ctx = useClerkContext();
	const client = useConvexClient();

	const OPENER: Message = {
		id: 1,
		role: 'ai',
		text: 'Halo! 👋 Saya akan membantu kamu menyusun laporan yang lengkap. Ceritakan masalah atau permintaanmu — tidak perlu format khusus, tulis saja dengan kata-katamu sendiri ya.'
	};

	let messages = $state<Message[]>([OPENER]);
	let inputValue = $state('');
	let isLoading = $state(false);
	let isChatDone = $state(false);
	let reportId = $state('');
	let errorMessage = $state('');
	let nextId = $state(2);
	let sessionRestored = $state(false);
	let showConfirmReset = $state(false);

	const savedSession = useQuery(api.chatSessions.getSession, () => ({}));
	const currentReport = useQuery(api.reports.getById, () =>
		reportId ? { id: reportId as Id<'reports'> } : 'skip'
	);

	const userInitials = $derived(getInitials(ctx.clerk?.user?.fullName));
	const userAvatar = $derived(ctx.clerk?.user?.imageUrl);

	// True when chat is done but draft hasn't been sent to Trello yet
	const isDraftUnsent = $derived(isChatDone && !!reportId && !currentReport.data?.trelloCardId);

	// Restore session from Convex once it loads
	$effect(() => {
		if (sessionRestored || savedSession.isLoading || savedSession.data === undefined) return;
		sessionRestored = true;

		const session = savedSession.data;
		if (!session) return;

		try {
			const parsed: Message[] = JSON.parse(session.messages);
			if (parsed.length > 0) {
				messages = parsed;
				nextId = Math.max(...parsed.map((m) => m.id)) + 1;
			}
		} catch {
			// Corrupted session data — start fresh
		}

		isChatDone = session.isChatDone;
		reportId = session.reportId ?? '';
	});

	// DOM refs for auto-scroll and auto-resize
	let messagesEnd = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	// Auto-focus textarea on mount and after session restore
	$effect(() => {
		if (textareaEl && !isChatDone) {
			textareaEl.focus();
		}
	});

	// Scroll to bottom when messages or loading state changes
	$effect(() => {
		messages.length;
		isLoading;
		isChatDone;
		tick().then(() => messagesEnd?.scrollIntoView({ behavior: 'smooth' }));
	});

	// Auto-resize textarea up to ~5 lines (120px)
	$effect(() => {
		inputValue;
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
		}
	});

	const DRAFT_START = '===TIKET_DRAFT===';
	const DRAFT_END = '===SELESAI===';

	function extractDraft(text: string): { clean: string; json: string } | null {
		const start = text.indexOf(DRAFT_START);
		const end = text.indexOf(DRAFT_END);
		if (start === -1 || end === -1) return null;
		const clean = text.slice(0, start).trim();
		const json = text.slice(start + DRAFT_START.length, end).trim();
		return { clean, json };
	}

	async function saveDraftToConvex(draft: TicketDraft): Promise<string> {
		const id = await client.mutation(api.reports.saveDraft, {
			title: draft.title,
			type: draft.type,
			priority: draft.priority,
			module: draft.module,
			description: draft.description,
			stepsToReproduce: draft.stepsToReproduce ?? undefined,
			expectedBehavior: draft.expectedBehavior ?? undefined,
			actualBehavior: draft.actualBehavior ?? undefined,
			frequency: draft.frequency ?? undefined,
			businessImpact: draft.businessImpact
		});
		return id;
	}

	async function persistSession(done: boolean, rid: string) {
		await client.mutation(api.chatSessions.saveSession, {
			messages: JSON.stringify(messages),
			isChatDone: done,
			reportId: rid || undefined
		});
	}

	async function startFresh() {
		await client.mutation(api.chatSessions.clearSession, {});
		messages = [OPENER];
		inputValue = '';
		isLoading = false;
		isChatDone = false;
		reportId = '';
		errorMessage = '';
		nextId = 2;
		showConfirmReset = false;
	}

	async function sendMessage() {
		const text = inputValue.trim();
		if (!text || isLoading || isChatDone) return;

		inputValue = '';
		errorMessage = '';

		messages = [...messages, { id: nextId++, role: 'user', text }];
		isLoading = true;

		try {
			// Map 'ai' → 'model' for Gemini API format
			const apiMessages = messages.map((m) => ({
				role: m.role === 'ai' ? 'model' : 'user',
				text: m.text
			}));

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: apiMessages })
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.message || 'Gagal menghubungi AI.');
			}

			const { text: aiText } = await res.json();

			const extracted = extractDraft(aiText);
			if (extracted) {
				const draft: TicketDraft = JSON.parse(extracted.json);
				const id = await saveDraftToConvex(draft);

				messages = [
					...messages,
					{
						id: nextId++,
						role: 'ai',
						text: extracted.clean || 'Oke, ini draft laporannya! Silakan cek di halaman preview ya.'
					}
				];
				reportId = id;
				isChatDone = true;
				isLoading = false;
				persistSession(true, id); // fire and forget — no need to block UI
			} else {
				messages = [...messages, { id: nextId++, role: 'ai', text: aiText }];
				isLoading = false;
				await tick();
				textareaEl?.focus();
				persistSession(false, reportId); // fire and forget
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal menghubungi AI. Coba lagi.';
		} finally {
			isLoading = false;
			// Wait for DOM to re-enable the textarea before focusing
			if (!isChatDone) {
				await tick();
				textareaEl?.focus();
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
	<div class="sticky top-0 z-10 bg-bg pt-6 pb-3">
		<PageHeader title="Buat Laporan Baru" backHref="/dashboard" backLabel="Kembali ke Dashboard">
			{#snippet right()}
				{#if messages.length > 1 || isChatDone}
					<Button size="sm" onclick={() => (showConfirmReset = true)}>+ Mulai Baru</Button>
				{/if}
			{/snippet}
		</PageHeader>

		<div class="h-px bg-border"></div>
	</div>

	<div class="flex-1 overflow-y-auto py-6">
		<div class="flex flex-col gap-4">
			{#each messages as message (message.id)}
				{#if message.role === 'ai'}
					<div class="flex items-start gap-3">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold text-accent"
						>
							AI
						</div>
						<div
							class="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground"
						>
							{message.text}
						</div>
					</div>
				{:else}
					<div class="flex items-start justify-end gap-3">
						<div
							class="max-w-[85%] rounded-2xl rounded-tr-sm border border-accent/20 bg-accent/15 px-4 py-3 text-sm leading-relaxed text-foreground"
						>
							{message.text}
						</div>
						{#if userAvatar}
							<img
								src={userAvatar}
								alt={userInitials}
								class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
							/>
						{:else}
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted"
							>
								{userInitials}
							</div>
						{/if}
					</div>
				{/if}
			{/each}

			<!-- Typing indicator -->
			{#if isLoading}
				<div class="flex items-start gap-3">
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold text-accent"
					>
						AI
					</div>
					<div
						class="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3"
					>
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]"
						></span>
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]"
						></span>
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]"
						></span>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<div class="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
					⚠️ {errorMessage}
					<div class="mt-2 flex flex-wrap items-center gap-3">
						<a href="/report/new" class="font-medium text-white underline hover:no-underline">
							Buat Manual →
						</a>
						<button
							type="button"
							onclick={() => (errorMessage = '')}
							class="cursor-pointer text-muted"
						>
							Tutup
						</button>
					</div>
				</div>
			{/if}

			<!-- Preview CTA — shown when AI finishes gathering info -->
			{#if isChatDone}
				<div
					class="mx-auto mt-2 w-full max-w-sm rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center"
				>
					<p class="mb-1 text-sm font-medium text-foreground">Informasi sudah lengkap!</p>
					<p class="mb-4 text-xs text-muted">
						Cek dan edit draft laporan sebelum dikirim ke Trello.
					</p>
					{#if reportId}
						<Button href="/report/preview/{reportId}" size="lg" class="w-full">
							Lanjut ke Review
							<ArrowRight />
						</Button>
					{:else}
						<div class="flex items-center justify-center gap-2 text-xs text-muted">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
							></div>
							Menyimpan draft...
						</div>
					{/if}
				</div>
			{/if}

			<div bind:this={messagesEnd}></div>
		</div>
	</div>

	<div class="sticky bottom-0 bg-bg py-4">
		<div class="mb-4 h-px bg-border"></div>
		{#if isChatDone}
			<p class="text-center text-xs text-muted">
				Sesi chat selesai. Lanjut ke preview laporan di atas.
			</p>
		{:else}
			<div class="flex items-end gap-2">
				<textarea
					bind:this={textareaEl}
					bind:value={inputValue}
					onkeydown={handleKeydown}
					placeholder="Ceritakan masalah atau permintaanmu..."
					rows={1}
					disabled={isLoading || isChatDone}
					class="max-h-[120px] flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted/60 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
				<Button
					type="button"
					onclick={sendMessage}
					loading={isLoading}
					disabled={!inputValue.trim() || isChatDone}
					class="h-11 w-11 shrink-0 rounded-xl p-0"
				>
					<Send size={18} />
				</Button>
			</div>
			<p class="mt-2 text-center text-xs text-muted/60">
				Tulis dengan bebas — AI yang akan merapikannya jadi laporan.
			</p>
		{/if}
	</div>
</div>

<!-- Confirm reset dialog -->
<Dialog
	open={showConfirmReset}
	title={isDraftUnsent ? 'Draft belum dikirim ke Trello!' : 'Mulai sesi baru?'}
	onclose={() => (showConfirmReset = false)}
>
	{#if isDraftUnsent}
		Draft laporan kamu belum dikirim ke Trello. Jika kamu mulai sesi baru, draft ini tetap tersimpan
		dan bisa diakses di <strong class="text-foreground">Riwayat</strong>.
	{:else}
		Semua pesan di sesi ini akan dihapus dan kamu akan mulai dari awal. Tindakan ini tidak bisa
		dibatalkan.
	{/if}
	{#snippet footer()}
		<Button size="sm" variant="secondary" onclick={() => (showConfirmReset = false)}>Batal</Button>
		<Button size="sm" variant="danger" onclick={startFresh}>Ya, Mulai Baru</Button>
	{/snippet}
</Dialog>
