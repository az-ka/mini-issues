# Desain Halaman Beranda (Reddit-Style Dashboard)

Dokumen ini merinci antarmuka utama tempat tim melihat, mencari, dan memberikan dukungan pada laporan bug atau request fitur.

## 1. Header & Statistik
- **Kartu Ringkasan:** [P0 Bug], [Popular Features], [Resolved This Month].
- **Aksi Utama:** Tombol "Buat Laporan Baru" dan link **"Draf Saya (N)"**.

## 2. Navigasi & Filter (Modular)
Filter modular yang mengontrol isi list laporan:
- **Tab Utama:** [Semua Laporan], [Laporan Saya], **[Draf Saya]**.
- **Filter Chips:** Tipe (Bug/Feature), Status (Pending/IP/Resolved), Departemen.
- **Sorting:** Terbaru (Default), Terbanyak Vote.

### Logika Pagination Reset
Setiap kali user berpindah tab (misal dari "Semua" ke "Draf") atau mengubah filter, cursor pagination wajib di-reset ke halaman 1.

---

## 3. Komponen Kartu Laporan (The Post Card)
Setiap kartu menampilkan:
- **Kiri:** Upvote & Tim Signal.
- **Tengah:** Judul, Metadata, dan **Label Draft** (Hanya jika di tab Draf Saya).
- **Kanan:** Status (Pending, IP, Resolved) & Estimasi.

## 4. Keuntungan Gaya Reddit
1. **Pusat Informasi:** User bisa melihat draf mereka dengan cepat tanpa tercampur laporan publik.
2. **Efisien:** Sistem tab membuat navigasi antara laporan pribadi dan publik tetap rapi.
