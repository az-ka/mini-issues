<script lang="ts">
	import { tick } from 'svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Role = 'ai' | 'user';

	interface Message {
		id: number;
		role: Role;
		text: string;
	}

	// Hardcoded opener to avoid an extra API call
	let messages = $state<Message[]>([
		{
			id: 1,
			role: 'ai',
			text: 'Halo! 👋 Saya akan membantu kamu menyusun laporan yang lengkap. Ceritakan masalah atau permintaanmu — tidak perlu format khusus, tulis saja dengan kata-katamu sendiri ya.'
		}
	]);

	let inputValue = $state('');
	let isLoading = $state(false);
	let isChatDone = $state(false);
	let errorMessage = $state('');
	let nextId = $state(2);

	// DOM refs for auto-scroll and auto-resize
	let messagesEnd = $state<HTMLDivElement | null>(null);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

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

			const draft = extractDraft(aiText);
			if (draft) {
				// TODO: replace with Convex persistence (step 5)
				sessionStorage.setItem('ticketDraft', draft.json);
				messages = [
					...messages,
					{
						id: nextId++,
						role: 'ai',
						text: draft.clean || 'Oke, ini draft tiketnya! Silakan cek di halaman preview ya.'
					}
				];
				isChatDone = true;
			} else {
				messages = [...messages, { id: nextId++, role: 'ai', text: aiText }];
			}
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Gagal menghubungi AI. Coba lagi.';
		} finally {
			isLoading = false;
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
		<PageHeader title="Buat Laporan Baru" backHref="/dashboard" backLabel="Kembali ke Dashboard" />
		<div class="h-px bg-border"></div>
	</div>

	<div class="flex-1 overflow-y-auto py-6">
		<div class="flex flex-col gap-4">
			{#each messages as message (message.id)}
				{#if message.role === 'ai'}
					<div class="flex items-start gap-3">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold text-accent">
							AI
						</div>
						<div class="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm text-foreground leading-relaxed">
							{message.text}
						</div>
					</div>
				{:else}
					<div class="flex items-start justify-end gap-3">
						<div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent/15 border border-accent/20 px-4 py-3 text-sm text-foreground leading-relaxed">
							{message.text}
						</div>
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
							R
						</div>
					</div>
				{/if}
			{/each}

			<!-- Typing indicator -->
			{#if isLoading}
				<div class="flex items-start gap-3">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold text-accent">
						AI
					</div>
					<div class="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3">
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]"></span>
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]"></span>
						<span class="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]"></span>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<div class="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
					⚠️ {errorMessage}
					<button
						type="button"
						onclick={() => (errorMessage = '')}
						class="ml-2 underline hover:no-underline"
					>
						Tutup
					</button>
				</div>
			{/if}

			<!-- Preview CTA — shown when AI finishes gathering info -->
			{#if isChatDone}
				<div class="mx-auto mt-2 w-full max-w-sm rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center">
					<p class="mb-1 text-sm font-medium text-foreground">Informasi sudah lengkap!</p>
					<p class="mb-4 text-xs text-muted">Cek dan edit draft tiket sebelum dikirim ke Trello.</p>
					<a href="/report/preview/draft">
						<Button size="lg" class="w-full">
							Lihat Preview Tiket
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M5 12h14" />
								<path d="M12 5l7 7-7 7" />
							</svg>
						</Button>
					</a>
				</div>
			{/if}

			<div bind:this={messagesEnd}></div>
		</div>
	</div>

	<div class="sticky bottom-0 bg-bg py-4">
		<div class="h-px bg-border mb-4"></div>
		{#if isChatDone}
			<p class="text-center text-xs text-muted">Sesi chat selesai. Lanjut ke preview tiket di atas.</p>
		{:else}
			<div class="flex items-end gap-2">
				<textarea
					bind:this={textareaEl}
					bind:value={inputValue}
					onkeydown={handleKeydown}
					placeholder="Ceritakan masalah atau permintaanmu..."
					rows={1}
					disabled={isLoading || isChatDone}
					class="flex-1 max-h-[120px] resize-none overflow-y-auto rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
				<button
					type="button"
					aria-label="Kirim pesan"
					onclick={sendMessage}
					disabled={!inputValue.trim() || isLoading || isChatDone}
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-bg transition-all hover:bg-accent/85 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M22 2L11 13" />
						<path d="M22 2L15 22 11 13 2 9l20-7z" />
					</svg>
				</button>
			</div>
			<p class="mt-2 text-center text-xs text-muted/60">
				Tulis dengan bebas — AI yang akan merapikannya jadi tiket.
			</p>
		{/if}
	</div>

</div>
