# Desain Admin Panel (Phase 2 - Low Priority)

Dokumen ini merinci fitur pengelolaan internal untuk Admin guna menjaga keamanan sistem "Internal Only" dan konsistensi data.

## 1. Fitur Utama (MVP)

### A. Manajemen User (Allow-list)
- **Tambah User:** Input manual email, nama, dan role.
- **Bulk Import (CSV):** Fitur untuk mengunggah daftar banyak karyawan sekaligus (Email, Nama, Role) guna mempercepat onboarding awal.
- **Daftar User:** Tabel untuk memantau siapa saja yang sudah terdaftar.
- **Hapus Akses:** Mencabut izin login user.

### B. Manajemen Departemen
- **Kelola List:** Tambah, Edit, atau Hapus departemen.
- **Relasi:** Menggunakan `departmentId` sebagai kunci utama untuk menghindari data rusak jika nama departemen di-rename.

---

## 2. Auditing (Log Admin)
Setiap tindakan Admin harus tercatat secara permanen di database untuk akuntabilitas:
- **Admin Log:** Mencatat aksi seperti "Admin @A changed Role of User @B to Developer" atau "Admin @A added Department Finance".
- **Visibilitas:** Hanya Admin yang bisa melihat log audit ini.

## 3. Tata Letak (UI)
Halaman ini bersifat fungsional dan hanya bisa diakses oleh user dengan `role: "admin"`.
- **Sidebar Khusus Admin.**
- **Modal Pop-up:** Untuk formulir tambah user/departemen agar tidak pindah halaman.
- **Bulk Upload Area:** Drag-and-drop CSV file.

## 4. Keamanan (Security)
- **Server-side Check:** Setiap mutation untuk Admin Panel wajib memvalidasi role user di Convex (menggunakan `ctx.auth.getUserIdentity()`).
- **Initial Bootstrapping:** Admin pertama didaftarkan secara manual melalui skrip seed database.

## 5. Mengapa Ini Penting? (The "Why")
Admin Panel memastikan sistem tetap terkontrol. Bulk Import mencegah proses yang membosankan saat tim bertambah besar, dan Admin Log memastikan setiap perubahan konfigurasi sistem dapat dilacak.
