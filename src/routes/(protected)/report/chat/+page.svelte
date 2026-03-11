<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	type Role = 'ai' | 'user';

	interface Message {
		id: number;
		role: Role;
		text: string;
	}

	const mockMessages: Message[] = [
		{
			id: 1,
			role: 'ai',
			text: 'Halo! Saya akan membantu kamu membuat laporan yang lengkap. Ceritakan masalah atau permintaanmu — tidak perlu format khusus, tulis saja dengan kata-katamu sendiri. 😊'
		},
		{
			id: 2,
			role: 'user',
			text: 'Jadi tadi saya coba login tapi setelah salah masukin password 3 kali, tombol loginnya jadi abu-abu dan tidak bisa diklik sama sekali. Padahal saya sudah ingat passwordnya yang benar.'
		},
		{
			id: 3,
			role: 'ai',
			text: 'Oke, paham! Jadi tombolnya jadi tidak aktif setelah 3 kali percobaan yang salah. Kira-kira ini terjadi di browser atau aplikasi apa? Dan apakah sudah coba refresh halaman?'
		},
		{
			id: 4,
			role: 'user',
			text: 'Di browser Chrome. Sudah coba refresh dan tombolnya tetap abu-abu. Harus tutup tab dulu baru bisa login lagi.'
		},
		{
			id: 5,
			role: 'ai',
			text: 'Noted! Seberapa sering ini terjadi? Apakah setiap kali salah 3 kali pasti begini, atau cuma kadang-kadang?'
		},
		{
			id: 6,
			role: 'user',
			text: 'Sepertinya setiap kali. Sudah terjadi 2 hari berturut-turut.'
		},
		{
			id: 7,
			role: 'ai',
			text: 'Baik, terima kasih! Satu pertanyaan lagi — apakah ini menghambat pekerjaanmu? Misalnya, kamu jadi tidak bisa akses sistem sama sekali sampai tutup tab?'
		},
		{
			id: 8,
			role: 'user',
			text: 'Iya cukup menghambat, apalagi kalau lagi buru-buru harus input data.'
		},
		{
			id: 9,
			role: 'ai',
			text: 'Oke, semua informasi sudah cukup! Saya sudah bisa menyusun tiket yang lengkap untuk kamu. Silakan lanjut ke halaman preview untuk cek hasilnya sebelum dikirim ke Trello. 🎉'
		}
	];

	let inputValue = $state('');
	const isChatDone = $derived(mockMessages.at(-1)?.role === 'ai' && mockMessages.length >= 9);
</script>

<div class="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">

	<!-- Header -->
	<div class="sticky top-0 z-10 bg-bg pt-6 pb-3">
		<PageHeader title="Buat Laporan Baru" backHref="/dashboard" backLabel="Kembali ke Dashboard" />
		<div class="h-px bg-border"></div>
	</div>

	<!-- Messages -->
	<div class="flex-1 overflow-y-auto py-6">
		<div class="flex flex-col gap-4">
			{#each mockMessages as message (message.id)}
				{#if message.role === 'ai'}
					<!-- AI bubble -->
					<div class="flex items-start gap-3">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-xs font-semibold text-accent">
							AI
						</div>
						<div class="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-surface px-4 py-3 text-sm text-foreground leading-relaxed">
							{message.text}
						</div>
					</div>
				{:else}
					<!-- User bubble -->
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

			<!-- AI typing indicator (shown when not done) -->
			{#if !isChatDone}
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

			<!-- Lanjut ke Preview CTA -->
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
		</div>
	</div>

	<!-- Input area -->
	<div class="sticky bottom-0 bg-bg py-4">
		<div class="h-px bg-border mb-4"></div>
		{#if isChatDone}
			<p class="text-center text-xs text-muted">Sesi chat selesai. Lanjut ke preview tiket di atas.</p>
		{:else}
			<div class="flex items-end gap-2">
				<textarea
					bind:value={inputValue}
					placeholder="Ceritakan masalah atau permintaanmu..."
					rows={1}
					class="flex-1 resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/15"
				></textarea>
				<button
					type="button"
					aria-label="Kirim pesan"
					disabled={!inputValue.trim()}
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
