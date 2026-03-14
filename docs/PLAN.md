# Mini Issues — Product Specification

> Dokumen ini adalah rencana produk (non-teknis). Tidak ada keputusan stack, database, atau framework di sini. Semua keputusan teknis ditentukan oleh developer saat implementasi.

**Versi:** 1.0  
**Status:** Draft  
**Bahasa Antarmuka:** Bahasa Indonesia

---

## Daftar Isi

1. [Latar Belakang & Masalah](#1-latar-belakang--masalah)
2. [Tujuan Produk](#2-tujuan-produk)
3. [Pengguna](#3-pengguna)
4. [Alur Utama (User Flow)](#4-alur-utama-user-flow)
5. [Halaman & Fitur](#5-halaman--fitur)
6. [Sistem Login & Akses](#6-sistem-login--akses)
7. [Perilaku AI](#7-perilaku-ai)
8. [Struktur Tiket](#8-struktur-tiket)
9. [Integrasi Trello](#9-integrasi-trello)
10. [Attachment](#10-attachment)
11. [Riwayat Tiket Reporter](#11-riwayat-tiket-reporter)
12. [Admin Panel](#12-admin-panel)
13. [Batasan Scope (Versi 1)](#13-batasan-scope-versi-1)
14. [Ukuran Keberhasilan](#14-ukuran-keberhasilan)
15. [Pertanyaan Terbuka](#15-pertanyaan-terbuka)

---

## 1. Latar Belakang & Masalah

Di banyak tim, proses pelaporan bug atau pengajuan fitur berjalan tidak efisien. Tim non-developer (QA, Operasional, PM, Customer Support) mengirimkan laporan yang sering kali:

- Terlalu singkat dan tidak ada konteks
- Tidak ada langkah reproduksi yang jelas
- Tidak jelas mana yang bug, mana yang feature request
- Tidak ada informasi dampak ke bisnis atau tingkat urgensi

Akibatnya, developer tidak bisa langsung bekerja. Mereka harus bolak-balik bertanya untuk menggali informasi yang seharusnya sudah ada di laporan pertama. Ini membuang waktu kedua belah pihak.

---

## 2. Tujuan Produk

Mini Issues adalah web tool internal yang bertindak sebagai **jembatan** antara tim non-developer dan tim developer. Tujuannya bukan menggantikan Trello, melainkan memastikan setiap tiket yang masuk ke Trello sudah **lengkap, terstruktur, dan langsung bisa dikerjakan**.

**Mini Issues melakukan ini dengan cara:**

- Mengajak reporter untuk mendeskripsikan masalah dengan bebas
- AI menggali detail yang kurang melalui percakapan natural
- AI merangkum semua informasi menjadi tiket terstruktur
- Reporter mengkonfirmasi dan mengirim tiket langsung ke Trello

---

## 3. Pengguna

### 3.1 Reporter (Pengguna Utama)

Siapa pun di luar tim developer yang perlu melaporkan masalah atau mengajukan permintaan. Mereka tidak harus melek teknis.

| Contoh Peran     | Kebutuhan Umum                           |
| ---------------- | ---------------------------------------- |
| QA / Tester      | Melaporkan bug hasil testing             |
| Product Manager  | Mengajukan feature request               |
| Operasional      | Melaporkan masalah yang menghambat kerja |
| Customer Support | Mengeskalasi keluhan pelanggan           |

**Karakteristik yang perlu diperhatikan:**

- Tidak terbiasa dengan format tiket teknis
- Tidak tahu apa itu "steps to reproduce" atau "expected behavior"
- Lebih nyaman bercerita daripada mengisi form
- Menggunakan Bahasa Indonesia sehari-hari

### 3.2 Admin

Orang yang bertanggung jawab mengelola siapa saja yang boleh mengakses tool ini. Bisa satu orang atau beberapa. Admin tidak perlu terlibat dalam proses pembuatan tiket.

### 3.3 Developer (Penerima Tiket)

Developer tidak menggunakan Mini Issues sama sekali. Mereka bekerja sepenuhnya di Trello seperti biasa. Mini Issues hanya memastikan tiket yang masuk ke Trello sudah berkualitas.

---

## 4. Alur Utama (User Flow)

### Gambaran Besar

```
Login
  └─→ Dashboard (Buat Tiket Baru / Lihat Riwayat)
        └─→ Chat dengan AI
              └─→ Halaman Preview & Edit
                    └─→ Kirim ke Trello
                          └─→ Halaman Konfirmasi
                                └─→ Kembali ke Dashboard
```

---

### Step-by-Step Detail

#### STEP 1 — Login

Reporter membuka Mini Issues dan login menggunakan email kantor. Sistem mengecek apakah email tersebut ada di daftar whitelist. Jika ada, reporter masuk. Jika tidak, muncul pesan bahwa akun belum terdaftar dan diminta menghubungi admin.

> Tidak ada halaman registrasi. Akun hanya bisa dibuat oleh admin.

---

#### STEP 2 — Dashboard

Setelah login, reporter melihat halaman dashboard yang berisi:

- Tombol **"Buat Laporan Baru"**
- Daftar tiket yang pernah dibuat sebelumnya (riwayat)

---

#### STEP 3 — Chat dengan AI

Reporter mengklik "Buat Laporan Baru" dan masuk ke halaman chat.

Di sini reporter **hanya** berinteraksi melalui teks. Tidak ada upload file di tahap ini.

**Yang terjadi di sini:**

1. AI menyambut reporter dan meminta mereka mendeskripsikan masalah atau request dengan kata-kata sendiri, bebas
2. Reporter mengetik laporan apa adanya, tidak perlu format khusus
3. AI menganalisis input — apakah sudah cukup untuk dijadikan tiket?
4. Jika belum cukup, AI mengajukan pertanyaan lanjutan **satu per satu**
5. Proses tanya-jawab berlanjut sampai semua informasi yang dibutuhkan sudah terkumpul
6. AI memberitahu reporter bahwa informasi sudah cukup dan mengajak lanjut ke preview tiket

> **Catatan penting:** AI tidak pernah meminta upload gambar atau file di tahap ini. Upload hanya tersedia di halaman preview.

---

#### STEP 4 — Halaman Preview & Edit

Setelah chat selesai, AI menghasilkan **draft tiket terstruktur**. Reporter dibawa ke halaman preview yang menampilkan tiket dalam format final.

Di halaman ini reporter bisa:

- **Membaca** seluruh isi draft tiket
- **Mengedit** bagian mana pun yang dirasa kurang tepat
- **Mengunggah attachment** (opsional) — screenshot atau video, maks 10MB
- **Menghapus attachment** yang sudah diupload jika berubah pikiran
- **Kembali ke chat** jika ternyata ada informasi besar yang salah

Sebelum mengirim, reporter membaca dan mengkonfirmasi bahwa isi tiket sudah benar.

---

#### STEP 5 — Kirim ke Trello

Reporter menekan tombol **"Kirim ke Trello"**.

Sistem mengirimkan tiket beserta attachment ke Trello secara otomatis. Tiket muncul sebagai card baru di board Trello yang sudah dikonfigurasi.

---

#### STEP 6 — Halaman Konfirmasi

Reporter melihat halaman konfirmasi yang berisi:

- Pesan sukses
- Judul tiket yang baru dibuat
- Link langsung ke Trello card (bisa dibuka di browser)
- Tombol untuk kembali ke Dashboard

---

#### STEP 7 — Tiket Tersimpan di Riwayat

Tiket yang sudah dikirim tersimpan di riwayat reporter. Reporter bisa melihatnya kapan saja dari dashboard. Status tiket diambil dari posisi card di Trello (read-only, tidak bisa diedit lagi dari web app).

---

## 5. Halaman & Fitur

### 5.1 Daftar Halaman

| Halaman           | Siapa yang Akses | Fungsi                                            |
| ----------------- | ---------------- | ------------------------------------------------- |
| Login             | Semua            | Masuk dengan email                                |
| Dashboard         | Reporter         | Titik awal — buat laporan baru atau lihat riwayat |
| Chat              | Reporter         | Sesi tanya-jawab dengan AI                        |
| Preview & Edit    | Reporter         | Review, edit, upload attachment, konfirmasi       |
| Konfirmasi Sukses | Reporter         | Notifikasi berhasil kirim + link Trello           |
| Riwayat Tiket     | Reporter         | Lihat semua tiket yang pernah dibuat              |
| Detail Tiket      | Reporter         | Lihat isi tiket + status terkini dari Trello      |
| Admin — Whitelist | Admin            | Kelola daftar email yang diizinkan akses          |

---

### 5.2 Fitur per Halaman

#### Dashboard

- Tombol "Buat Laporan Baru" yang menonjol
- Daftar ringkas tiket terbaru (judul, tipe, status, tanggal)
- Bisa klik tiket untuk lihat detail

#### Chat dengan AI

- Input teks bebas
- Riwayat percakapan terlihat seperti chat biasa
- Indikator "AI sedang mengetik..."
- Tombol lanjut ke Preview muncul saat AI sudah selesai menggali informasi

#### Preview & Edit

- Tampilan tiket lengkap sebelum dikirim
- Semua field bisa diedit inline
- Area upload attachment (drag & drop atau klik untuk pilih file)
- Preview thumbnail attachment yang sudah diupload
- Batasan ukuran file terlihat jelas (maks 10MB per file)
- Tombol "Kirim ke Trello" dan tombol "Kembali ke Chat"

#### Riwayat & Detail Tiket

- Daftar semua tiket yang pernah dibuat reporter ini
- Filter berdasarkan tipe (Bug / Feature / Improvement) dan status
- Status tiket diambil real-time dari Trello (nama list tempat card berada)
- Isi tiket read-only setelah dikirim
- Link ke Trello card tersedia

#### Admin — Whitelist

- Tabel daftar email yang sudah diizinkan
- Form tambah email baru
- Tombol hapus email
- Tidak ada fitur lain di admin panel

---

## 6. Sistem Login & Akses

### Prinsip

- Tidak ada halaman registrasi publik
- Akses hanya diberikan melalui whitelist yang dikelola admin
- Login menggunakan email (metode autentikasi ditentukan oleh developer saat implementasi — bisa magic link, password, atau SSO)

### Alur Login

```
Reporter buka Mini Issues
  └─→ Masukkan email
        ├─→ Email ada di whitelist → Masuk ke Dashboard
        └─→ Email tidak ada → Tampilkan pesan:
              "Email kamu belum terdaftar. Hubungi admin untuk mendapatkan akses."
```

### Peran & Hak Akses

| Peran    | Hak Akses                                            |
| -------- | ---------------------------------------------------- |
| Reporter | Login, buat tiket, lihat & track tiket milik sendiri |
| Admin    | Semua hak reporter + kelola whitelist email          |

> Developer tidak perlu punya akun di Mini Issues. Mereka bekerja langsung di Trello.

---

## 7. Perilaku AI

### Tujuan AI dalam Produk Ini

AI berperan sebagai **interviewer yang ramah**, bukan sebagai form yang kaku. Tugasnya adalah menggali informasi yang dibutuhkan developer tanpa membuat reporter merasa diinterogasi.

### Cara AI Berkomunikasi

- Bahasa santai, sehari-hari, Bahasa Indonesia
- Pertanyaan singkat, tidak bertele-tele
- Satu pertanyaan per giliran — tidak membombardir dengan banyak pertanyaan sekaligus
- Tidak menghakimi atau menyalahkan reporter
- Jika reporter tidak tahu jawabannya, AI menerima dan lanjut ke pertanyaan lain

### Informasi yang AI Gali

AI menyesuaikan pertanyaan berdasarkan tipe laporan yang terdeteksi:

**Untuk Bug:**

- Di halaman atau bagian mana bug ini terjadi?
- Apa yang seharusnya terjadi (expected)?
- Apa yang sebenarnya terjadi (actual)?
- Langkah-langkah untuk membuat bug ini muncul kembali?
- Seberapa sering ini terjadi? (Selalu / Kadang / Sekali)
- Apakah ini menghambat pekerjaan? Seberapa parah dampaknya?

**Untuk Feature Request / Improvement:**

- Apa masalah atau kebutuhan yang melatarbelakangi request ini?
- Siapa yang akan menggunakan fitur ini?
- Bagaimana gambaran solusi yang diinginkan?
- Seberapa mendesak ini dibutuhkan?

### Yang AI Deteksi Otomatis

- **Tipe laporan:** Bug / Feature Request / Improvement — dari kata kunci dan konteks
- **Estimasi prioritas:** High / Medium / Low — berdasarkan dampak yang disebutkan
  - High: "tidak bisa login", "data hilang", "crash", "transaksi gagal"
  - Medium: fitur tidak bekerja tapi ada workaround
  - Low: permintaan improvement tampilan atau kenyamanan
- **Modul/halaman yang terdampak:** dari deskripsi reporter

### Kapan AI Berhenti Bertanya

AI berhenti menggali informasi ketika semua field wajib tiket sudah terisi cukup. AI tidak akan terus bertanya jika informasi sudah memadai, meskipun masih ada field yang bisa diisi lebih detail.

### Batasan AI

- AI **tidak membuat keputusan prioritas final** — hanya memberikan saran. Developer tetap yang menentukan prioritas di Trello
- AI **tidak mengakses data internal** perusahaan atau sistem lain
- AI **tidak memproses file** — attachment dihandle terpisah di halaman preview

---

## 8. Struktur Tiket

Berikut adalah semua field yang ada di sebuah tiket. AI bertanggung jawab mengisi field ini berdasarkan percakapan.

| Field                  | Deskripsi                                 | Wajib?               |
| ---------------------- | ----------------------------------------- | -------------------- |
| **Judul**              | Ringkasan singkat, maks 80 karakter       | Ya                   |
| **Tipe**               | Bug / Feature Request / Improvement       | Ya                   |
| **Prioritas**          | High / Medium / Low (saran dari AI)       | Ya                   |
| **Deskripsi**          | Penjelasan lengkap masalah atau request   | Ya                   |
| **Steps to Reproduce** | Langkah untuk mereproduksi (khusus Bug)   | Jika Bug             |
| **Expected Behavior**  | Apa yang seharusnya terjadi               | Jika Bug             |
| **Actual Behavior**    | Apa yang sebenarnya terjadi               | Jika Bug             |
| **Halaman / Modul**    | Di mana masalah terjadi di aplikasi       | Ya                   |
| **Frekuensi**          | Selalu / Kadang-kadang / Sekali           | Jika Bug             |
| **Dampak Bisnis**      | Seberapa besar pengaruhnya ke operasional | Ya                   |
| **Attachment**         | Gambar atau video pendukung               | Tidak (opsional)     |
| **Dilaporkan Oleh**    | Nama & email reporter                     | Otomatis dari login  |
| **Tanggal Laporan**    | Kapan tiket dibuat                        | Otomatis dari sistem |

---

## 9. Integrasi Trello

### Prinsip

Mini Issues adalah **jembatan satu arah** ke Trello:

```
Mini Issues  ──────────────────→  Trello
(buat & kirim tiket)         (source of truth untuk developer)
```

Mini Issues tidak menggantikan Trello. Setelah tiket terkirim, developer bekerja sepenuhnya di Trello.

### Yang Dikirim ke Trello

Saat reporter mengklik "Kirim", sistem membuat card baru di Trello dengan:

- **Nama card:** Judul tiket
- **Deskripsi card:** Semua field tiket dalam format yang rapi dan mudah dibaca developer
- **Label:** Berdasarkan tipe (Bug / Feature Request / Improvement) dan prioritas (High / Medium / Low)
- **List tujuan:** Card masuk ke list "Incoming" atau "Backlog" (dikonfigurasi saat setup)
- **Attachment:** File yang diupload reporter (jika ada)
- **Komentar awal:** Nama reporter dan tanggal laporan

### Membaca Status dari Trello

Untuk menampilkan status tiket di riwayat reporter, web app membaca **posisi card di Trello** (nama list tempat card berada saat ini).

Contoh pemetaan status:

| List di Trello       | Status yang ditampilkan di Mini Issues |
| -------------------- | -------------------------------------- |
| Incoming / Backlog   | Menunggu Review                        |
| In Progress / Doing  | Sedang Dikerjakan                      |
| Review / Testing     | Dalam Review                           |
| Done / Completed     | Selesai                                |
| Won't Fix / Rejected | Ditolak                                |

> Pemetaan nama list → label status ini dikonfigurasi saat setup oleh developer.

### Setelah Tiket Terkirim

- Reporter bisa melihat status tiket (read-only)
- Reporter **tidak bisa mengedit** isi tiket dari Mini Issues
- Reporter mendapat link langsung ke Trello card
- Semua perubahan isi tiket (jika diperlukan) dilakukan langsung di Trello oleh developer

---

## 10. Attachment

### Aturan

| Aspek                   | Ketentuan                                       |
| ----------------------- | ----------------------------------------------- |
| Kapan bisa upload       | Hanya di halaman Preview, sebelum tiket dikirim |
| Tipe file yang diterima | Gambar (JPG, PNG, GIF) dan Video (MP4, MOV)     |
| Ukuran maksimal         | 10MB per file                                   |
| Jumlah file             | Tidak lebih dari 5 file per tiket               |
| Wajib?                  | Tidak — sepenuhnya opsional                     |

### Kenapa Upload Hanya di Preview

Memisahkan upload dari sesi chat membuat percakapan dengan AI lebih fokus dan tidak terganggu. Reporter juga lebih siap mengumpulkan bukti visual setelah mereka sudah tahu apa yang perlu didokumentasikan — yaitu setelah AI membantu mereka memahami masalahnya dengan jelas.

### Batasan 10MB

Batasan ini mengikuti ketentuan Trello free tier untuk attachment. Jika file melebihi batas, sistem menampilkan pesan error yang jelas dan meminta reporter mengkompres file terlebih dahulu.

---

## 11. Riwayat Tiket Reporter

### Halaman Riwayat

Setiap reporter bisa melihat semua tiket yang pernah mereka buat. Halaman ini menampilkan:

- Daftar tiket dengan judul, tipe, prioritas, status, dan tanggal
- Filter berdasarkan tipe dan status
- Pencarian berdasarkan kata kunci judul

### Halaman Detail Tiket

Klik tiket membuka halaman detail yang menampilkan:

- Seluruh isi tiket (read-only)
- Status terkini (diambil dari Trello)
- Attachment yang pernah diupload
- Link ke Trello card

### Apa yang Bisa dan Tidak Bisa Dilakukan Reporter

| Aksi                       | Bisa?            |
| -------------------------- | ---------------- |
| Lihat isi tiket            | ✅               |
| Lihat status terkini       | ✅ (dari Trello) |
| Buka link Trello card      | ✅               |
| Edit tiket setelah dikirim | ❌               |
| Hapus tiket                | ❌               |
| Tambah komentar            | ❌ (versi 1)     |

---

## 12. Admin Panel

Admin panel sengaja dibuat **sesimpel mungkin**. Satu-satunya fungsi admin di Mini Issues adalah mengelola whitelist email.

### Halaman Admin — Whitelist Email

Menampilkan:

- Tabel daftar email yang sudah diizinkan (email, nama, tanggal ditambahkan)
- Form untuk menambahkan email baru
- Tombol hapus per baris
- Konfirmasi sebelum menghapus email

### Yang Tidak Ada di Admin Panel

- Tidak ada dashboard tiket (developer lihat tiket di Trello)
- Tidak ada statistik atau laporan
- Tidak ada pengaturan Trello (dikonfigurasi saat setup awal)
- Tidak ada manajemen role yang kompleks

---

## 13. Batasan Scope (Versi 1)

Berikut adalah hal-hal yang **sengaja tidak dimasukkan** ke versi pertama untuk menjaga produk tetap fokus dan bisa diluncurkan lebih cepat.

| Fitur                                   | Alasan Ditunda                                                    |
| --------------------------------------- | ----------------------------------------------------------------- |
| Notifikasi email/Slack saat tiket masuk | Developer bisa set notifikasi langsung dari Trello                |
| Komentar di tiket setelah dikirim       | Kompleksitas sync dua arah tidak sebanding dengan value-nya di v1 |
| Deteksi duplikat tiket                  | Perlu matching yang matang agar tidak salah deteksi               |
| Multi-board Trello                      | Perlu desain routing yang lebih kompleks                          |
| Dashboard admin untuk lihat semua tiket | Developer sudah punya Trello untuk ini                            |
| Rekam layar (screen recording)          | Hanya gambar dan video yang sudah direkam yang bisa diupload      |
| Multi-bahasa                            | Cukup Bahasa Indonesia untuk kebutuhan internal                   |
| Registrasi mandiri                      | Sengaja dibatasi agar akses terkontrol                            |

---

## 14. Ukuran Keberhasilan

Produk dianggap berhasil jika setelah **1 bulan** digunakan, memenuhi kondisi berikut:

| Metrik                                                                 | Target                         |
| ---------------------------------------------------------------------- | ------------------------------ |
| Tiket yang langsung bisa dikerjakan tanpa tanya-tanya lagi ke reporter | > 80% dari total tiket masuk   |
| Waktu rata-rata reporter mengisi laporan                               | < 5 menit                      |
| Adopsi oleh tim non-developer yang relevan                             | > 70% sudah pernah menggunakan |
| Kepuasan reporter (survei singkat setelah kirim tiket)                 | Rating ≥ 4 dari 5              |

---

## 15. Pertanyaan Terbuka

Hal-hal berikut perlu dijawab bersama tim sebelum mulai pembangunan:

1. **Trello board mana** yang akan jadi tujuan tiket? Apakah satu board untuk semua divisi atau nanti perlu beda board?
2. **Nama list di Trello** yang dipakai saat ini apa saja? (Untuk pemetaan status yang akurat)
3. **Siapa yang pertama jadi admin** dan mengelola whitelist?
4. **Apakah ada format tiket yang sudah dipakai** developer saat ini yang perlu dipertahankan di deskripsi Trello card?
5. **Notifikasi:** apakah developer mau dinotifikasi lewat Trello saja, atau perlu Slack/email juga? (Untuk pertimbangan versi berikutnya)
6. **Siapa yang maintain** tool ini setelah selesai dibuat?

---

_Mini Issues Product Spec v1.0 — Dokumen ini adalah rencana produk, bukan dokumen teknis. Keputusan stack, database, dan infrastruktur ditentukan sepenuhnya oleh developer._
