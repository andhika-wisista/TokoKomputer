# RasaNusa — Software Requirements Specification

Versi 0.1 (Draft) · 2026-11-19 · Status: siap untuk latihan 1 hari
Aplikasi: katalog produk UMKM makanan/minuman berbasis web, single-device.

## 1. Tujuan

- Menyediakan katalog produk UMKM makanan/minuman untuk latihan 1 hari.
- Calon pembeli dapat melihat produk dan langsung menghubungi toko via WhatsApp.
- Pengelola toko dapat mengelola data produk (CRUD demo) dan melihat ringkasan, tanpa backend.

Batasan teknis: Vite + JavaScript vanilla; tanpa backend; tanpa login palsu; tanpa API key; data contoh nonpribadi; penyimpanan localStorage saja; tidak ada perintah berbahaya.

## 2. Pengguna

| Peran | Kebutuhan | Mode |
|---|---|---|
| Calon pembeli | Lihat katalog, cari, filter, urutkan, pesan via WhatsApp | Tampil (default) |
| Pengelola toko | Kelola produk (CRUD), lihat ringkasan | Kelola (toggle tombol, tanpa login) |

Satu perangkat, dua mode lewat tombol "Mode Kelola" — tidak ada autentikasi.

## 3. Daftar fitur (MVP)

- F1 Katalog: 8 produk contoh (seed) tampil sebagai kartu.
- F2 Kartu produk: foto/placeholder lokal, nama, kategori, harga Rupiah, stok, badge "unggulan". Stok 0 → label "Habis".
- F3 Pencarian: nama + deskripsi, case-insensitive.
- F4 Filter kategori: Makanan, Minuman, Snack, Bumbu, Semua.
- F5 Sorting: harga naik/turun, nama A–Z/Z–A.
- F6 Tombol "Pesan via WhatsApp" → buka `wa.me` dengan teks pesan berisi nama produk.
- F7 Dashboard kelola: list produk, tambah, edit, hapus (dengan konfirmasi hapus).
- F8 Validasi form: nama wajib, harga angka >= 0, stok integer >= 0.
- F9 Ringkasan: total produk, total stok.
- F10 Persistensi localStorage + seed ulang otomatis + tombol "Reset data".

## 4. Data model

Produk (`Product`):

| Field | Tipe | Aturan |
|---|---|---|
| id | string | unik, immutable, format `RSN-001` |
| nama | string | wajib, 3–60 karakter |
| kategori | string | enum: Makanan, Minuman, Snack, Bumbu |
| harga | number | integer >= 0 (Rupiah) |
| stok | integer | >= 0 |
| deskripsi | string | opsional, maks 280 karakter |
| imageUrl | string | path lokal `/assets/...` atau placeholder SVG; opsional |
| unggulan | boolean | default false |

Penyimpanan: `localStorage` key `rasanusa:products:v1`, berisi array of Product. Seed 8 item jika kosong.

Contoh seed (fiktif, nonpribadi):

| id | nama | kategori | harga | stok | unggulan |
|---|---|---|---|---|---|
| RSN-001 | Keripik Singkong Pedas | Snack | 18000 | 50 | ya |
| RSN-002 | Kopi Gayo Wine Process | Minuman | 38000 | 24 | tidak |
| RSN-003 | Sambal Ijo | Bumbu | 22000 | 40 | ya |
| RSN-004 | Brownis Kukus | Makanan | 15000 | 30 | tidak |
| RSN-005 | Es Teh Manis | Minuman | 8000 | 0 | tidak |
| RSN-006 | Kerupuk Udang | Snack | 20000 | 35 | tidak |
| RSN-007 | Dodol Garut | Makanan | 30000 | 20 | tidak |
| RSN-008 | Bumbu Racik Rendang | Bumbu | 28000 | 18 | tidak |

Format harga tampilan: `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.

Format WhatsApp: `https://wa.me/6281234567890?text=` + `encodeURIComponent("Halo, saya mau pesan " + nama + " (" + harga + ").")` — nomor contoh, ganti nanti; tanpa API key.

## 5. Nonfunctional requirements

- NFR-1 Performa: halaman tampil < 2 detik di localhost; render 8 item < 50 ms; re-render hanya saat state berubah.
- NFR-2 Kompatibilitas: Chrome/Edge/Firefox terbaru; mobile-first; layar >= 360 px.
- NFR-3 Keamanan: tanpa API key di source; tanpa backend; tanpa data pribadi; hanya localStorage.
- NFR-4 Dapat diuji manual: semua acceptance criteria diperiksa tanpa tool khusus.
- NFR-5 Aksesibilitas dasar: tombol berlabel teks, kontras >= 4.5:1, fokus terlihat.
- NFR-6 Pemeliharaan: tanpa dependensi runtime selain Vite; ES module; tanpa framework UI.

## 6. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data contoh tidak representatif | Demo gagal | 8 produk, 4 kategori, stok bervariasi termasuk 0 |
| localStorage dibersihkan | Data hilang | Seed otomatis + tombol Reset data |
| Format URL WhatsApp salah | Pesan kosong | AC-3 memeriksa URL yang terbuka |
| Scope creep ke checkout/pembayaran | Telat | Out-of-scope dikunci di section 7 |
| Validasi input longgar | Data rusak | Validasi form + tipe data seed |

## 7. Out-of-scope

Backend, database, login/auth, keranjang, checkout, pembayaran, multi-user, deploy produksi, PWA, SEO, multi-bahasa, notifikasi, export/import CSV, desain visual final (placeholder dulu).

## 8. Acceptance criteria (manual)

- AC-1: `npm run dev` → katalog terbuka dengan 8 kartu produk.
- AC-2: Tiap kartu tampil foto/placeholder, nama, kategori, harga format Rp (mis. "Rp 18.000"), stok, badge unggulan; stok 0 → "Habis".
- AC-3: Klik "Pesan via WhatsApp" → browser buka `wa.me` dengan teks berisi nama produk.
- AC-4: Cari "kopi" → hanya produk mengandung "kopi" tampil; "KOPI" sama hasilnya.
- AC-5: Filter kategori Minuman → 3 produk; "Semua" → 8.
- AC-6: Sort harga naik → urutan 8.000, 15.000, 18.000, ...; turun terbalik; nama A–Z berurutan.
- AC-7: Dashboard, tambah produk valid → katalog + ringkasan total produk +1.
- AC-8: Edit harga → simpan → harga berubah di katalog.
- AC-9: Hapus produk → konfirmasi → produk hilang, ringkasan -1.
- AC-10: Ringkasan: total produk = jumlah data; total stok = jumlah stok (cocok hitungan manual).
- AC-11: Refresh halaman → data tetap tersimpan.
- AC-12: Form harga -1000 atau stok -1 → error, tidak tersimpan.
- AC-13: `grep -R "sk-\|api_key\|token" src` → tidak ada API key.
- AC-14: Seed 8 produk semua nama/foto fiktif, tanpa data pribadi.

## 9. Implementation plan per iterasi

| Iterasi | Durasi | Pekerjaan |
|---|---|---|
| I0 Setup | 30 mnt | Vite vanilla JS, struktur `src/`, `seed.js`, render katalog statis |
| I1 Katalog | 1 jam | Search, filter kategori, sorting, format harga Rp |
| I2 WhatsApp + aset | 45 mnt | Tombol `wa.me`, placeholder SVG lokal |
| I3 Dashboard CRUD | 1 jam | List, tambah/edit/hapus, validasi form, ringkasan |
| I4 Persistensi | 30 mnt | localStorage, seed ulang, tombol Reset data |
| I5 Uji + polish | 30 mnt | Uji manual AC-1..AC-14, perbaiki bug, responsif |

Total ~4,5 jam + buffer 1,5 jam. Definition of done: semua AC lulus, tanpa API key, tanpa backend, data nonpribadi.
