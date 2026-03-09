# Data Model & Skema Database (Convex Auth) - Ultimate Version (Complete)

Dokumen ini adalah sumber kebenaran tunggal untuk seluruh struktur data aplikasi.

## 1. Tabel Utama: `reports`

| Field | Tipe Convex | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| **title** | `v.string()` | Ya | Judul Laporan (Dinamis: Bug/Fitur) |
| **type** | `v.string()` | Ya | `"bug"` atau `"feature"` |
| **departmentId** | `v.id("departments")` | Ya | Relasi ke Departemen Aktif |
| **reporterId** | `v.id("users")` | Ya | Pelapor |
| **assigneeId** | `v.optional(v.id("users"))` | Tidak | Developer penanggung jawab |
| **status** | `v.string()` | Ya | `Draft`, `Pending`, `In Progress`, `Need Info`, `Resolved`, `Closed`, `Cancelled` |
| **voteCount** | `v.number()` | Ya | Counter upvote (Default 0) |
| **duplicateOfId** | `v.optional(v.id("reports"))` | Tidak | Link ke laporan asli |
| **timelineEstimate** | `v.optional(v.string())` | Tidak | `"1-3_days"`, `"1-2_weeks"`, dll |
| **createdAt** | `v.number()` | Ya | Timestamp dibuat |
| **updatedAt** | `v.number()` | Ya | Timestamp update terakhir |

### ⚠️ Validasi Mutation (Field Kondisional)
Field berikut wajib divalidasi di sisi server sebelum `db.insert` atau `db.patch`:

**Jika Bug:**
- `priority`: `"low" | "medium" | "high" | "blocker"`
- `environment`: Teks bebas (Browser, OS, URL)
- `stepsToReproduce`: Urutan langkah
- `frequency`: `"always" | "often" | "sometimes" | "rarely"`
- `expectedResult`: Hasil yang seharusnya
- `actualResult`: Hasil yang terjadi

**Jika Feature:**
- `businessUrgency`: `"low" | "medium" | "high"`
- `userStory`: "Sebagai [role], saya ingin..."
- `currentProblem`: Masalah yang diatasi
- `acceptanceCriteria`: Syarat selesai

---

## 2. Tabel Users (Extension)
Menggunakan tabel `users` bawaan **Convex Auth** dengan penambahan:
- `role`: `"reporter" | "developer" | "admin"` (Default: `"reporter"`)
- `departmentId`: `v.optional(v.id("departments"))`

---

## 3. Tabel Pendukung

### `comments` (Discussion Thread)
| Field | Tipe Convex | Deskripsi |
| :--- | :--- | :--- |
| **reportId** | `v.id("reports")` | Laporan terkait |
| **authorId** | `v.id("users")` | Penulis komentar |
| **content** | `v.string()` | Markdown + @mention support |
| **parentId** | `v.optional(v.id("comments"))` | Threaded reply |
| **isPrivate** | `v.boolean()` | `true` = Hanya Dev/Admin yang bisa lihat |
| **editedAt** | `v.optional(v.number())` | Timestamp jika diedit |
| **createdAt** | `v.number()` | Timestamp |

### `votes` (Engagement Tracker)
| Field | Tipe Convex | Deskripsi |
| :--- | :--- | :--- |
| **reportId** | `v.id("reports")` | Laporan terkait |
| **userId** | `v.id("users")` | Pemberi vote (1 user = 1 vote) |
| **departmentName** | `v.string()` | **Snapshot:** Nama/Slug Dept user saat voting (Immutable) |

### `activityLog` & `adminLog`
Audit trail untuk aksi user (`activityLog`) dan aksi administratif (`adminLog`).

### `reportFiles` (Metadata Storage)
| Field | Tipe Convex | Deskripsi |
| :--- | :--- | :--- |
| **reportId** | `v.id("reports")` | Relasi ke laporan |
| **storageId** | `v.id("_storage")` | ID Convex Storage |
| **uploaderId** | `v.id("users")` | Pengunggah |
| **fileType** | `v.string()` | MIME type (Validated server-side) |
| **createdAt** | `v.number()` | Timestamp |

### `departments` (Master Data)
| Field | Tipe Convex | Deskripsi |
| :--- | :--- | :--- |
| **name** | `v.string()` | Nama tampilan (Sales, Finance) |
| **slug** | `v.string()` | Identifier unik (sales, finance) |
| **isActive** | `v.boolean()` | **Soft Delete:** `false` = Tidak muncul di form baru |

### `notifications` (Deep Linking Support)
| Field | Tipe Convex | Deskripsi |
| :--- | :--- | :--- |
| **userId** | `v.id("users")` | Penerima notifikasi |
| **reportId** | `v.id("reports")` | Deep link ke halaman laporan |
| **commentId** | `v.optional(v.id("comments"))` | Deep link ke komentar spesifik |
| **type** | `v.string()` | `"status_change"`, `"mention"`, `"assigned"` |
| **content** | `v.string()` | Cuplikan pesan/isi notifikasi |
| **isRead** | `v.boolean()` | Status baca |
| **createdAt** | `v.number()` | Timestamp |

---

## 4. State Machine (Status Transitions)

| Dari | Ke (Valid) | Aksi |
| :--- | :--- | :--- |
| **Draft** | `Pending` | Submit Laporan (Publikasikan) |
| **Pending** | `In Progress`, `Cancelled` | Dev ambil / User batal |
| **In Progress** | `Need Info`, `Resolved`, `Cancelled` | Tanya info / Selesai / Batal |
| **Need Info** | `In Progress` | Auto-transition saat Reporter komen |
| **Resolved** | `Closed`, `In Progress` | User konfirmasi / Dev Reopen |
| **Closed** | `In Progress` | Reopen jika masalah muncul lagi |
| **Cancelled** | `Pending` | Re-submit (Reuse record & history) |

---

## 5. Kebijakan Cleanup (Auto-job)
- **Draft Cleanup:** Cron Job mingguan menghapus Draft yang tidak di-update > 30 hari beserta `reportFiles` & `_storage` terkait.
