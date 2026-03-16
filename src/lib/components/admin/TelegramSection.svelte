<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/api';
	import { extractError } from '$lib/utils';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { toast } from 'svelte-sonner';
	import { Info } from 'lucide-svelte';

	const client = useConvexClient();
	const settingsQuery = useQuery(api.notificationSettings.get, {});

	let saveError = $state('');
	let isTesting = $state(false);

	let notifyOnNew = $state(true);
	let initialized = $state(false);

	$effect(() => {
		if (settingsQuery.data && !initialized) {
			notifyOnNew = settingsQuery.data.notifyOnNew;
			initialized = true;
		}
	});

	async function saveField(patch: { notifyOnNew?: boolean }) {
		saveError = '';
		try {
			await client.mutation(api.notificationSettings.update, {
				notifyOnNew,
				...patch
			});
		} catch (err) {
			saveError = extractError(err, 'Gagal menyimpan pengaturan.');
		}
	}

	async function handleTest() {
		if (isTesting) return;
		isTesting = true;
		try {
			const res = await fetch('/api/telegram/test', { method: 'POST' });
			if (res.ok) {
				toast.success('Notifikasi Telegram terkirim!');
			} else {
				toast.error('Gagal mengirim notifikasi Telegram.');
			}
		} catch {
			toast.error('Gagal mengirim notifikasi Telegram.');
		} finally {
			isTesting = false;
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
		<Info size={14} class="mt-0.5 shrink-0 text-muted" />
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
		<div class="flex items-center gap-3 px-4 py-3.5">
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
			<Button variant="secondary" size="sm" loading={isTesting} onclick={handleTest}>Test</Button>
		</div>
	</div>

	{#if saveError}
		<p class="mt-2 text-xs text-danger">{saveError}</p>
	{/if}
</div>
