# Desain Sistem Notifikasi

Sistem notifikasi memastikan alur kerja tidak terhenti dengan memberikan sinyal proaktif kepada user.

## 1. Pemicu Notifikasi (Triggers)

| Kejadian | Penerima | Prioritas |
| :--- | :--- | :--- |
| **@Mention dalam Komentar** | User yang di-mention | **Ultra High** |
| **Laporan di-assign** | Developer (Assignee) | High |
| **Status menjadi "Need Info"** | Reporter | High |
| **Status menjadi "Resolved"** | Reporter | Medium |
| **Komentar Baru (Publik)** | Reporter & Assignee | Medium |

## 2. Kanal & Penyimpanan
- **Data Notifikasi:** Disimpan di tabel `notifications` (lihat `data-model.md`).
- **In-app UI:** Badge angka merah pada sidebar dan daftar notifikasi yang bisa diklik.
- **Deep Linking:** Klik notifikasi akan mengarahkan user langsung ke halaman detail laporan terkait.

## 3. Implementasi (Logic)
- Notifikasi dipicu melalui **Convex Action** setelah mutation (comment/status change) berhasil.
- **Deduplikasi:** Jangan kirim notifikasi jika user melakukan aksi pada laporannya sendiri (misal: reporter komen di laporannya sendiri).
