# Desain Formulir Pelaporan (Structured Forms)

Dokumen ini merinci struktur formulir yang akan digunakan oleh tim lain untuk berkomunikasi dengan tim pengembang (developer).

## 1. Satu Judul untuk Semua (Dinamis)
Kita menghapus field "Nama Fitur" yang redundan. Field `title` di database digunakan untuk Bug maupun Feature.
- **Label di UI:** Berubah otomatis berdasarkan tipe (misal: "Judul Bug" atau "Nama Fitur").

## 2. Strategi Draf & Auto-save
Mencegah hilangnya data pada formulir panjang:
- **LocalStorage Draft:** Setiap input user di-save secara otomatis ke `localStorage`. Jika tab tertutup/crash, data akan kembali saat form dibuka.
- **Convex Draft Status:** Jika user menekan "Simpan sebagai Draf", laporan disimpan ke database dengan status **`status: "Draft"`**. Laporan ini tidak akan muncul di dashboard publik.
- **Submit (Publish):** Laporan akan berubah dari status `Draft` menjadi `Pending` saat user menekan tombol "Kirim Laporan".

---

## 3. Jenis Laporan & Kolom Spesifik

### Laporan Bug
| Nama Kolom | Jenis Input | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Prioritas** | **Select** | **Ya** | **Low, Medium, High, Blocker.** |
| **Environment** | Textarea | Ya | Browser, OS, URL, Role Akun. |
| **Langkah Reproduksi**| Textarea | Ya | Urutan langkah 1, 2, 3... |
| **Frekuensi** | Select | Ya | Selalu, Sering, Kadang, Jarang. |
| **Hasil** | Box (A/B) | Ya | Hasil yang Diharapkan vs Hasil Aktual. |
| **Bukti Visual** | **File Upload** | - | Screenshot error atau **Alur Logika** (misal: dari Excalidraw). |

### Request Fitur
| Nama Kolom | Jenis Input | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Urgensi Bisnis** | Select | Ya | Low, Medium, High. |
| **User Story** | Textarea | Ya | "As a [role], I want to [feature] so that [benefit]." |
| **Masalah Saat Ini** | Textarea | Ya | Alasan kenapa fitur ini dibutuhkan. |
| **Kriteria Selesai** | Textarea | Ya | Acceptance Criteria agar scope tidak creep. |
| **Alur Logika** | **File Upload** | - | Dianjurkan upload gambar alir (Figma/Excalidraw). |

---

## 4. Validasi & Pengiriman
- **MIME Check:** Server memvalidasi tipe file bukti visual sebelum menyimpan ke Convex Storage.
- **Proactive Detection:** Panel "Laporan Serupa" muncul saat user mengetik judul untuk mencegah duplikasi.
- **Required Check:** Tombol "Kirim" hanya aktif jika semua field wajib terisi.
