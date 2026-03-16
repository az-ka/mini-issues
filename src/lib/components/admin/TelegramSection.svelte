<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/api';
	import { extractError } from '$lib/utils';
	import Toggle from '$lib/components/ui/Toggle.svelte';

	const client = useConvexClient();
	const settingsQuery = useQuery(api.notificationSettings.get, {});

	let saveError = $state('');

	// Local state mirrors Convex — synced once when data loads
	let notifyOnNew = $state(true);
	let notifyOnStatusChange = $state(false);
	let notifyOnAssign = $state(false);
	let initialized = $state(false);

	$effect(() => {
		if (settingsQuery.data && !initialized) {
			notifyOnNew = settingsQuery.data.notifyOnNew;
			notifyOnStatusChange = settingsQuery.data.notifyOnStatusChange;
			notifyOnAssign = settingsQuery.data.notifyOnAssign;
			initialized = true;
		}
	});

	async function saveField(patch: {
		notifyOnNew?: boolean;
		notifyOnStatusChange?: boolean;
		notifyOnAssign?: boolean;
	}) {
		saveError = '';
		try {
			await client.mutation(api.notificationSettings.update, {
				notifyOnNew,
				notifyOnStatusChange,
				notifyOnAssign,
				...patch
			});
		} catch (err) {
			saveError = extractError(err, 'Gagal menyimpan pengaturan.');
		}
	}
</script>

<div>
	<!-- Header -->
	<div class="mb-4">
		<h2 class="text-sm font-semibold text-foreground">Notifikasi Telegram</h2>
		<p class="mt-0.5 text-xs text-muted">
			Kirim notifikasi ke grup Telegram saat event tertentu terjadi.
		</p>
	</div>

	<!-- Bot config hint -->
	<div class="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
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
		<p class="text-xs text-muted">
			Bot Token & Chat ID dikonfigurasi via environment variable
			<code class="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">TELEGRAM_BOT_TOKEN</code>
			dan
			<code class="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">TELEGRAM_CHAT_ID</code>.
		</p>
	</div>

	<!-- Toggles -->
	<div class="overflow-hidden rounded-xl border border-border bg-surface">
		<!-- Tiket baru -->
		<div class="flex items-center gap-3 border-b border-border px-4 py-3.5">
			<span class="h-2 w-2 shrink-0 rounded-full {notifyOnNew ? 'bg-success' : 'bg-muted/40'}"
			></span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-foreground">Tiket baru dibuat</p>
				<p class="text-xs text-muted">Notif dikirim saat tiket berhasil dikirim ke Trello.</p>
			</div>
			<Toggle
				bind:checked={notifyOnNew}
				label="Toggle notifikasi tiket baru"
				onchange={(val) => saveField({ notifyOnNew: val })}
			/>
		</div>

		<!-- Status berubah -->
		<div class="flex items-center gap-3 border-b border-border px-4 py-3.5 opacity-50">
			<span class="h-2 w-2 shrink-0 rounded-full bg-muted/40"></span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-foreground">Status tiket berubah</p>
				<p class="text-xs text-muted">Belum tersedia — fitur status change belum diimplementasi.</p>
			</div>
			<Toggle
				bind:checked={notifyOnStatusChange}
				label="Toggle notifikasi status berubah"
				disabled
			/>
		</div>

		<!-- Di-assign -->
		<div class="flex items-center gap-3 px-4 py-3.5 opacity-50">
			<span class="h-2 w-2 shrink-0 rounded-full bg-muted/40"></span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-foreground">Tiket di-assign</p>
				<p class="text-xs text-muted">Belum tersedia — fitur assign belum diimplementasi.</p>
			</div>
			<Toggle bind:checked={notifyOnAssign} label="Toggle notifikasi tiket di-assign" disabled />
		</div>
	</div>

	{#if saveError}
		<p class="mt-2 text-xs text-danger">{saveError}</p>
	{/if}
</div>
