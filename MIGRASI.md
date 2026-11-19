# MIGRASI RasaNusa: dari localStorage ke Node.js + PostgreSQL/Supabase

## 1. Kondisi Saat Ini (LocalStorage)
- **Data penyimpanan**: Semua produk disimpan di `localStorage` dengan key `rasanusa:products:v1`.
- **Keterbatasan**:
  - Tidak ada autentikasi (semua pengguna bisa mengakses/ubah data).
  - Tidak ada isolasi data pemilik (semua data bersaing).
  - Tidak ada audit log (tidak ada rekaman perubahan).
  - Tidak ada validasi server-side (validasi hanya di frontend).
  - Tidak ada persiapan untuk skala (hanya satu browser session).
  - Tidak ada HTTPS/HTTPS-only session cookie (rentan keamanan).

## 2. Target Arsitektur
- **Frontend**: SPA (Single Page Application) yang berkomunikasi dengan backend API via HTTPS.
- **Backend**: Node.js (Express atau Fastify) + PostgreSQL (atau Supabase sebagai PaaS).
- **Autentikasi**: 
  - Registrasi & Login (argon2/bcrypt untuk hash password).
  - Session cookie **HttpOnly**, **Secure**, **SameSite=Lax/Strict**.
  - Rate limiting & CSRF token.
- **RBAC (Role-Based Access Control)**:
  - Role: `admin`, `kasir`, `pemilik`.
  - Middleware server-side yang mengecek permission sebelum mengizinkan operasi.
- **Isolasi Data Pemilik**:
  - Setiap baris produk memiliki `owner_id` (UUID pengguna).
  - Query selalu filter berdasarkan `owner_id` (misal: `WHERE owner_id = $1`).
  - PostgreSQL Row Level Security (RLS) sebagai benteng kedua.
- **Audit Log**:
  - Tabel `audit_logs` (append-only) mencatat:
    - `actor_id` (user ID)
    - `action` (create/update/delete)
    - `entity` (produk, kategori, dll)
    - `entity_id`
    - `before` & `after` (JSON string)
    - `timestamp`
    - `ip_address` & `user_agent`
- **Input Validation**:
  - Server-side (zod) untuk validasi tipe, range, dan validasi kategori.
  - Client-side hanya untuk UX, bukan sumber kebenaran.

## 3. Diagram Alur (ASCII)
```
+----------------+        HTTPS        +------------------+       SQL       +------------------+
| Browser (SPA)  |  <------------>  | Node.js API      |  <---------->  | PostgreSQL       |
| - fetch JSON   |  cookie (HttpOnly)  | - auth (argon2)  |  RLS policy   | - products       |
| - no auth data |  Secure (HTTPS)     | - RBAC middleware|               | - audit_logs     |
+----------------+                  | - zod validation |               | - owner_id col   |
                                   +------------------+               +------------------+
                                        |                                |
                                        v                                v
                               session store (redis/db)           RLS policy:
                                                             USING (owner_id = auth.uid())
```

## 4. Rencana Migrasi Bertahap

### Fase 0 — Sekarang (localStorage)
- **Fokus**: Fitur dasar (katalog, CRUD, filter, sorting, WA button) + validasi client-side.
- **Keterbatasan**: Tidak ada autentikasi, data hanya untuk satu pengguna, tidak ada audit.

### Fase 1 — Backend API + Auth (3 minggu)
- **Tugas**:
  - Buat API REST (CRUD produk).
  - Implementasi autentikasi (register/login) dengan argon2 hash.
  - Set session cookie (HttpOnly, Secure, SameSite).
  - Rate limiting & CSRF token.
- **Output**: API siap dipanggil dari frontend (tanpa UI baru, hanya fetch).

### Fase 2 — Database + RLS (2 minggu)
- **Tugas**:
  - Migrasi data `rasanusa:products:v1` dari localStorage ke PostgreSQL.
  - Tambahkan kolom `owner_id` (UUID) ke tabel `products`.
  - Aktifkan RLS policy: `CREATE POLICY ON products USING (owner_id = auth.uid());`
  - Verifikasi data terisolasi per pemilik.

### Fase 3 — RBAC + Audit (3 minggu)
- **Tugas**:
  - Implementasi role-based middleware (admin > kasir > pemilik).
  - Tambah tabel `audit_logs` dan trigger untuk mencatat setiap perubahan.
  - Pastikan audit log tidak bisa diubah/delete (append-only).
- **Output**: Pengguna memiliki peran, audit log tercatat, dan akses terbatas.

### Fase 4 — Deploy & Hardening (2 minggu)
- **Tugas**:
  - Deploy ke server dengan HTTPS + HSTS.
  - Pastikan session cookie `Secure` hanya bekerja di HTTPS.
  - Rate limiting (100 req/min per IP).
  - Backup rutin data dan audit log.

## 5. Catatan Penting
- **Tidak ada login palsu di frontend**: Semua autentikasi harus melalui backend dengan session cookie yang aman.
- **Tema visual tetap**: Gunakan tema gelap Tech Pro (warna #0F172A, #3B82F6, #22D3EE) untuk konsistensi, tidak diubah untuk "penjualan komputer".
- **Validasi**: Selalu lakukan validasi di server (zod), bukan hanya di client.
- **Audit Log**: Harus mencatat siapa yang melakukan perubahan, kapan, dan apa yang diubah (before/after).

## 6. Diagram Visual (Opsional)
```
[Frontend]  --> HTTPS --> [Node.js API]  --> PostgreSQL (RLS) --> Audit Log
   |            |                 |               |
   |            |   Auth (cookie) |               |
   |            +-----------------+               |
   +---------------------------------------------+
```

## 7. Keterkaitan dengan Prompt
- **Produk tetap makanan RasaNusa** sesuai SPEC.md (8 produk, 4 kategori).
- **Tema tetap gelap Tech Pro** (tidak diganti ke tema makanan).
- **Dashboard CRUD** sesuai permintaan, validasi ketat, dan perubahan langsung terlihat di katalog publik.
- **Migrasi** hanya untuk konteks ini, tidak perlu dieksekusi sekarang.

--- 
*Catatan: Semua file yang dibuat (store.js, ui.js, dashboard.js, main.js, style.css) sudah siap diintegrasikan ke proyek yang ada.*