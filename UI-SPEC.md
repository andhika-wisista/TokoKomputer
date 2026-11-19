# RasaNusa — UI Specification (UI-SPEC.md)

Versi 0.1 · 2026-11-19 · Status: wireframe teks, desain belum final

## 1. Visual design

### 1.1 Palet warna (Swatch pilihan)
| Nama | Nilai Hex | Apa pakai | Catatan kontras |
|---|---|---|---|
| `bg-page` | `#FAFAFA` | Latar belakang halaman utama | kontras terhadap teks warna |
| `bg-card` | `#FFFFFF` | Kartu produk | kontras >= 4.5:1 terhadap teks hitam |
| `accent-primary` | `#E63946` | Tombol CTA, link utama | kontras terhadap bg-page 4.8:1 |
| `accent-secondary` | `#2A9D8F` | Tag unggulan, hover | kontras terhadap bg-page 3.2:1 (hanya untuk elemen dekoratif) |
| `muted-text` | `#6D6D6D` | Teks sekunder, deskripsi | kontras terhadap bg-page 4.6:1 |
- `text-primary` | `#222222` | Teks utama, nama produk | — |
- `border-default` | `#DDDDDD` | Garis pembatas | — |

### 1.2 Typography
- Font keluarga: **Inter**, fallback `'Segoe UI', Tahoma, Arial, sans-serif`.
- Ukuran tipografi skala desktop (px):
  - `h1`: 32
  - `h2`: 24
  - `h3`: 18
  - `body`: 14
  - `caption`: 12
- Ukuran tipografi skala mobile (px, < 600px):
  - `h1`: 24
  - `h2`: 20
  - `h3`: 16
  - `body`: 13
  - `caption`: 11
- Berat font: Regular 400, Medium 500, Semi-bold 600.
- Warna teks: `text-primary` default, `muted-text` untuk deskripsi/label sekunder.
- Line-height: 1.5; `text-wrap: balance` untuk judul.

### 1.3 Aksesibilitas kontras minimal
| Elemen | Kontras minimal |
|---|---|
| Teks putih `#fff` terhadap bg-primary `#FAFAFA` | 1.9:1 (hanya jika bg abu-abu gelap) |
| Teks hitam `#222` terhadap bg-primary `#FAFAFA` | 8.5:1 |
| Teks putih `#fff` terhadap accent-primary `#E63946` | 3.0:1 (hanya untuk small element) |
| Teks hitam `#222` terhadap accent-primary `#E63946` | 5.2:1 |
| Teks hitam `#222` terhadap bg-card `#FFFFFF` | 21:1 |
- Semua tombol berlabel teks yang jelas; fokus `:focus-visible` warna `#E63946` outline 3px.

## 2. Layout

### 2.1 Desain mobile-first
| Lebar viewport | Layout | Kolom grid produk | Spacing |
|---|---|---|---|
| < 600px | 1 kolom vertikal | 1 kolom | 1rem antar item |
| 600px – 900px | 2 kolom | 2 kolom | 1.2rem antar kolom/item |
| > 900px | 3 kolom | 3 kolom | 1.5rem antar kolom/item |

- Header/navbar: full-width, sticky top, tinggi 56px; logo kiri, menu/toggle kanan.
- Hero (jika ada): full-width, padding vertical 1rem, teks centang.
- Grid produk: `display: grid; gap: ...;` aturan di atas; setiap kartu `background: bg-card; border-radius: 8px; padding: 1rem; text-align: center;`.
- Footer: full-width, text-center, bg bg-card, padding vertical 1rem.

### 2.2 Wireframe teks desktop (lebar 1200px)
```
+======================================================================+
|  LOGO              | MENU [Katalog] [Toko] [Mode Kelola] |  +
|----------------------------------------------------------------------| +
|  HI               |  "RasaNusa"                                                          |
|  Selamat datang di|  katalog produk UMKM makanan/minuman                                     |
|  dunia rasa nusantara   |                                                                       |
|======================================================================| |
|  CARI ...  |  FILTER: [Semua] [Makanan] [Minuman] [Snack] [Bumbu]            | |
|----------------------------------------------------------------------| |
|  GRID PRODUK (3 kolom):                                               |
|  +-------+ +-------+ +-------+                                     |
|  |  ☐   | |  ☐   | |  ☐   |                                     |
|  | Keripik| | Kopi   | | Brownis|                                     |
|  | Singkong| | Gayo   | | Kukus  |                                     |
|  |  Rp18K | |  Rp38K | |  Rp15K |                                     |
|  | Stok:50| | Stok:24| | Stok:30|                                     |
|  +-------+ +-------+ +-------+                                     |
|  +-------+ +-------+ +-------+                                     |
|  |  ☐   | |  ☐   | |  ☐   |                                     |
|  | Sambal | | Es Teh | | Dodol  |                                     |
|  | Ijo    | | Manis  | | Garut  |                                     |
|  |  Rp22K | |  Rp8K  | |  Rp30K |                                     |
|  | Stok:40| | Stok:0 →| | Stok:20|                                     |
|  +-------+ +-------+ +-------+                                     |
|  +-------+ +-------+ +-------+                                     |
|  |  ☐   | |  ☐   | |  ☐   |                                     |
|  | Bumbu  | | Kerupuk| |        |                                     |
|  | Racik  | | Udang  | |        |                                     |
|  |  Rp28K | |  Rp20K | |        |                                     |
|  | Stok:18| | Stok:35| |        |                                     |
|  +-------+ +-------+ +-------+                                     |
|                                                                       |
|  RINGKASAN: 8 produk | Total stok: 217                              |
|                                                                       |
|  [Pesan WhatsApp]                                                    |
|                                                                       |
|  FOOTER © 2026 RasaNusa                                              |
+======================================================================+
```
- Setiap kartu produk: foto/placeholder di atas (kotak persegi 4:3, warna `#e0e0e0` placeholder), nama di bawah, harga bawah nama, stok di kiri bawah, badge "Unggulan" di kanan atas jika `unggulan=true`.
- Tombol "Pesan WhatsApp": full-width, warna `accent-primary`, teks putih.
- Ringkasan total produk/stok: di bawah grid, kiri atau kanan, teks abu-abu `muted-text`.

### 2.3 Wireframe teks mobile (lebar 360px)
```
+======================================================================+
|  LOGO              | [☰]                                          | +
|----------------------------------------------------------------------| +
|  HI "RasaNusa"                                                         |
|  katalog produk UMKM makanan/minuman                                     |
|======================================================================| |
|  CARI: [input text]                                                    | |
|----------------------------------------------------------------------| |
|  FILTER: [Semua] [Makanan] [Minuman] [Snack] [Bumbu]                  | |
|----------------------------------------------------------------------| |
|  PRODUK 1. Keripik Singkong Pedas                                      |
|  Foto: [placeholder]                                                   |
|  Harga: Rp 18.000                                                      |
|  Stok: 50                                                              |
|  [Unggulan]                                                            |
|  [Pesan WhatsApp]                                                      |
|----------------------------------------------------------------------| |
|  PRODUK 2. Kopi Gayo Wine Process                                      |
|  ...                                                                   |
|----------------------------------------------------------------------| |
|  ... (setiap produk vertikal)                                          |
|----------------------------------------------------------------------| |
|  RINGKASAN: 8 produk | Total stok: 217                               | [Reset data]  |
|======================================================================| |
|  [Pesan WhatsApp] (full-width)                                         |
|======================================================================| |
|  FOOTER © 2026 RasaNusa                                               |
+======================================================================+
```
- Nav toggle `☰` ganti menu muncul slide-down atau accordion.
- Grid 1 kolom, produk tampil vertikal, foto di atas lebar penuh kartu.
- Ringkasan di bawah grid atau sticky di footer bawah.

## 3. Komponen UI (detail)

### 3.1 Navigasi
- Logo kiri: teks "RasaNusa", warna `text-primary`, ukuran 20px tinggi.
- Menu: daftar tautan desktop, ikon `☰` mobile.
- Tombol "Mode Kelola": toggle memindah mode, teks "Kelola", warna `accent-secondary`, tidak berfungsi tanpa login (demo).

### 3.2 Kartu produk
```
+-----------------------------------------------------------+
|  [FOTO/placeholder 4:3]                                   |
|  Nama produk (garis bawah foto)                          |
|  Harga: Rp 18.000                                        |
|  Stok: 50  [Unggulan]  (jika unggulan)                  |
|  [Pesan WhatsApp]                                         |
+-----------------------------------------------------------+
```
- Foto: max-width 100%; placeholder warna `#e0e0e0` jika `imageUrl` kosong.
- "Unggulan": badge kecil di kanan atas, warna `accent-secondary`, teks putih, radius 4px.
- "Pesan WhatsApp": tombol full-width kartu, warna `accent-primary`, teks putih.

### 3.3 Tombol WhatsApp
- Ukuran: height 44px minimal (touch target).
- Warna latar: `accent-primary` `#E63946`.
- Warna teks: putih `#FFFFFF`.
- Radius: 4px.
- `aria-label`: "Pesan penulis via WhatsApp".

### 3.4 Dashboard demo CRUD
- Modal atau halaman terpisah "Mode Kelola".
- Form: input nama (wajib), kategori dropdown, harga number (integer >=0), stok integer >=0, textarea deskripsi opsional, toggle unggulan, input imageUrl opsional.
- Tombol simpan warna `accent-primary`, tombol batal warna `muted-text`.
- Tabel daftar produk di bawah form: kolom Nama, Kategori, Harga, Stok, Aksi (Edit/Hapus).
- Ringkasan bawah tabel: total produk, total stok.

### 3.5 Form validasi
- Field wajib: label merah jika kosong, focus merah `#E63946`.
- Harga/stok: hanya angka, tidak bisa negatif, notifikasi jika input invalid.
- Tombol simpan dinonaktifkan jika form tidak valid.

## 4. Persistensi data

- Key `localStorage: rasanusa:products:v1`, JSON array product.
- Seed 8 item jika key belum ada atau tombol Reset ditekan.
- Setiap perubahan produk (tambah/edit/hapus) update `localStorage` langsung.
- Refresh halaman data tetap ada.

## 5. Nonfunctional UI targets

- **Performa**: re-render hanya state berubah; < 50ms untuk 8 item.
- **Responsif**: breakpoint 600px; grid kolom menyesuaikan.
- **Aksesibilitas**: kontras >= 4.5:1 untuk teks utama; fokus visible; tombol label jelas.
- **Kompatibilitas**: Chrome/Edge/Firefox terbaru; mobile viewport >= 360px.
- **Tidak ada dependensi UI framework**: vanilla JS + CSS; Vite build; tanpa React/Vue/Angular.

## 6. Out-of-scope visual
- Desain ilustrasi foto produk asli (pakai placeholder SVG/warna abu-abu).
- Animasi kompleks; hanya hover/focus state sederhana.
- Tema gelap/terang toggle (hanya light mode default).

## 7. Verifikasi manual
- Lihat warna di DevTools, kontras vs bg.
- Toggle viewport browser: 320px, 640px, 1024px, 1440px.
- Coba filter, search, sorting.
- Coba tambah produk invalid, simpan → error.
- Coba hapus → konfirmasi → hilang.
- Coba tombol Reset → data awal.
- Buka URL WhatsApp dari tombol → teks sudah terisi nama + harga.