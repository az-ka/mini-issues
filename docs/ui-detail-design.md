# Desain Halaman Detail (GitHub Technical + Reddit Discussion)

Dokumen ini merinci tata letak dan fitur pada halaman rincian laporan untuk memastikan data teknis tersampaikan dengan jelas dan diskusi tetap teratur.

## 1. Timeline & Diskusi (Hybrid System)
- **Threaded Comments:** Sistem reply dengan dukungan **Markdown** dan **@mention**.
- **Komentar Privat:** Hanya terlihat oleh Dev/Admin. Background berwarna khusus.
- **Sinyal Aktivitas (Reporter View):** Jika ada komentar privat, Reporter akan melihat indikator samar: *"Developer sedang mendiskusikan laporan ini secara internal"* agar mereka tahu proses tetap berjalan.
- **Edit & Delete:** User dapat mengedit atau menghapus komentarnya sendiri (dengan tanda "Edited").

## 2. Aksi & Status (State Machine)

### Aksi Reporter
- **Tutup Laporan:** Jika status `Resolved`.
- **Reopen:** Jika status `Closed` tapi masalah belum tuntas.
- **Batalkan:** Bisa dilakukan selama status **Bukan** `Resolved` atau `Closed`.

### Aksi Developer (Quick Tools)
- **Assignee:** Mengeset siapa yang mengerjakan laporan.
- **Status Change:** Pilihan status dibatasi oleh State Machine (misal: Pending tidak bisa langsung ke Resolved).
- **Audit Trail:** Log aktivitas otomatis muncul di sela komentar (misal: "@Dev changed status to In Progress").

---

## 3. Tata Letak (Two-Column)
- **Kolom Kiri (Data Laporan):** Detail bug/fitur, bukti visual (Screenshot/Alur), dan diskusi publik.
- **Kolom Kanan (Sidebar):** Status, Assignee, Reporter, Metadata waktu, dan Quick Actions (untuk Dev).

## 4. Keunggulan (The "Why")
1. **Transparansi:** Reporter tahu laporan diproses tanpa harus melihat diskusi teknis internal.
2. **Kerapihan:** Sistem reply mencegah percakapan tumpang tindih.
3. **Akuntabilitas:** Setiap perubahan status/assignee terekam secara otomatis.
