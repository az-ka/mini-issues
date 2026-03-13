<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	const mockTicket = {
		id: 'MI-042',
		title: 'Tombol login tidak merespon setelah salah password 3 kali',
		type: 'bug' as const,
		priority: 'high' as const,
		trelloUrl: 'https://trello.com/c/example'
	};

	const priorityColor = { high: 'red', medium: 'yellow', low: 'green' } as const;
	const typeColor = { bug: 'red', feature: 'blue', improvement: 'green' } as const;
	const typeLabel = { bug: 'Bug', feature: 'Feature', improvement: 'Improvement' } as const;
	const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' } as const;
</script>

<div class="flex min-h-dvh items-center justify-center p-4">
	<div class="w-full max-w-sm">

		<!-- Icon -->
		<div class="mb-6 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="28"
					height="28"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-success"
				>
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			</div>
		</div>

		<!-- Title -->
		<div class="mb-6 text-center">
			<h1 class="text-xl font-bold text-foreground">Tiket berhasil dikirim!</h1>
			<p class="mt-1.5 text-sm text-muted">
				Tiketmu sudah masuk ke Trello dan siap dikerjakan oleh tim developer.
			</p>
		</div>

		<!-- Ticket summary -->
		<div class="mb-6 rounded-2xl border border-border bg-surface p-4">
			<p class="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Ringkasan Tiket</p>

			<div class="mb-3 flex items-center gap-2">
				<span class="text-xs font-mono text-accent">{mockTicket.id}</span>
				<span class="text-muted">·</span>
				<Badge color={typeColor[mockTicket.type]}>{typeLabel[mockTicket.type]}</Badge>
				<Badge color={priorityColor[mockTicket.priority]}>{priorityLabel[mockTicket.priority]}</Badge>
			</div>

			<p class="text-sm font-medium leading-snug text-foreground">
				{mockTicket.title}
			</p>

			<div class="mt-3 flex items-center gap-1.5 text-xs text-muted">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
				Dikirim pada 17 Juli 2025, 14:32
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-3">
			<Button variant="secondary" size="lg" class="w-full" href={mockTicket.trelloUrl} target="_blank" rel="noopener noreferrer">
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
					<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</svg>
				Buka di Trello
			</Button>

			<Button size="lg" class="w-full" href="/dashboard">
				Kembali ke Dashboard
			</Button>
		</div>

	</div>
</div>
