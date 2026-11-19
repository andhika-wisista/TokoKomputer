# RasaNusa — Task Breakdown (TASKS.md)

Versi 0.1 · 2026-11-19 · Berdasarkan SPEC.md + UI-SPEC.md
Milestone urut untuk latihan 1 hari (≈ 6 jam kerja). Setiap tugas: acceptance criteria + berkas yang berubah.

---

## M0 — Scaffold (30 menit)

**Tujuan**: Proyek Vite + vanilla JS siap jalan; struktur folder; script seed & util.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M0.1 `npm create vite@latest . -- --template vanilla` | `npm run dev` jalan, halaman kosong muncul | `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/style.css` |
| M0.2 Hapus boilerplate Vite (counter, dll) | `src/main.js` kosong except import CSS; tidak ada error console | `src/main.js`, `src/style.css` |
| M0.3 Buat struktur folder: `src/data/`, `src/ui/`, `src/utils/`, `src/assets/` | Folder ada; Vite build tidak error | (folder baru) |
| M0.4 `src/data/seed.js` — array 8 produk per SPEC §4 | `import { seed } from './data/seed.js'` → 8 item, format benar | `src/data/seed.js` |
| M0.5 `src/utils/storage.js` — `load()`, `save(arr)`, `reset()` ke `localStorage` key `rasanusa:products:v1` | `load()` mengembalikan array; `save()` persist; `reset()` taruh seed | `src/utils/storage.js` |
| M0.6 `src/utils/format.js` — `formatRupiah(n)`, `waUrl(nama, harga)` | Fungsi pure, testable di console | `src/utils/format.js` |
| M0.7 `src/utils/id.js` — `nextId(existing)` → `RSN-009` dst | Unik, incremental, prefix `RSN-` | `src/utils/id.js` |
| M0.8 CSS reset + variabel warna dari UI-SPEC §1.1 | `:root` berisi `--bg-page`, `--accent-primary`, dll; tidak ada style hardcode | `src/style.css` |

**Definition of Done M0**: `npm run dev` → halaman putih bersih, console clean, seed & util siap dipakai.

---

## M1 — Katalog (1 jam)

**Tujuan**: Render 8 kartu produk responsif sesuai UI-SPEC §2.2/2.3.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M1.1 `src/ui/ProductCard.js` — komponen kartu (foto/placeholder, nama, kategori, harga, stok, badge unggulan, tombol WA) | Menerima object `product`, mengembalikan HTML string; placeholder `#e0e0e0` jika `imageUrl` kosong; stok 0 → "Habis" | `src/ui/ProductCard.js` |
| M1.2 `src/ui/Catalog.js` — render grid dari array produk | `render(products)` → inject ke `#catalog-grid`; grid CSS 1/2/3 kolom per breakpoint | `src/ui/Catalog.js`, `src/style.css` |
| M1.3 `src/main.js` — load seed via `storage.load()`, render catalog | 8 kartu tampil benar; harga format `Rp 18.000`; badge unggulan hijau (`accent-secondary`) | `src/main.js` |
| M1.4 Hero section minimal: judul "RasaNusa", subjudul per UI-SPEC wireframe | Hero full-width, padding 1rem, teks center | `index.html`, `src/style.css` |
| M1.5 Footer © 2026 RasaNusa | Footer ada di bawah | `index.html`, `src/style.css` |

**Definition of Done M1**: AC-1, AC-2 lulus manual (8 kartu, format benar, responsif 320/640/1024).

---

## M2 — Interaksi: Pencarian, Filter, Sorting (45 menit)

**Tujuan**: User bisa cari, filter kategori, urutkan.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M2.1 `src/ui/Toolbar.js` — render input search, select filter kategori, select sort | Toolbar di atas grid; filter opsi: Semua, Makanan, Minuman, Snack, Bumbu; sort: harga ↑/↓, nama A-Z/Z-A | `src/ui/Toolbar.js`, `src/style.css` |
| M2.2 `src/utils/filter.js` — `filterProducts(products, { query, category, sort })` | Pure function; case-insensitive search nama+deskripsi; filter enum; sort stabil | `src/utils/filter.js` |
| M2.3 Hubungkan toolbar → state → re-render catalog | Ketik cari → update real-time; ganti filter/sort → update; URL tidak berubah (SPA) | `src/main.js`, `src/ui/Catalog.js` |
| M2.4 Debounce search 150ms | Mengetik cepat tidak lag | `src/main.js` |

**Definition of Done M2**: AC-4, AC-5, AC-6 lulus manual.

---

## M3 — WhatsApp Integration (30 menit)

**Tujuan**: Tombol "Pesan via WhatsApp" buka `wa.me` dengan teks terisi.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M3.1 `format.waUrl(nama, harga)` sudah ada di M0.6 — pastikan pakai nomor contoh `6281234567890` | URL valid, `encodeURIComponent` benar | `src/utils/format.js` |
| M3.2 `ProductCard` tombol WA → `window.open(waUrl, '_blank')` | Klik → tab baru buka WhatsApp Web/App dengan teks "Halo, saya mau pesan Keripik Singkong Pedas (Rp 18.000)." | `src/ui/ProductCard.js` |
| M3.3 `aria-label` "Pesan via WhatsApp" pada tombol | Aksesibilitas lulus | `src/ui/ProductCard.js` |

**Definition of Done M3**: AC-3 lulus manual.

---

## M4 — Instagram (Opsional / Stretch, 30 menit)

**Catatan**: SPEC & UI-SPEC **tidak** mencantumkan Instagram. Jika waktu sisa, tambahkan:

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M4.1 Tombol "Share to Instagram" (ikon) di kartu → buka `https://www.instagram.com/` (tidak ada deep link tanpa backend) | Tombol ada, klik buka Instagram homepage | `src/ui/ProductCard.js`, `src/style.css` |
| M4.2 Atau: link profil toko di navbar/footer | Link statis ke `https://instagram.com/rasanusa` | `index.html`, `src/style.css` |

**Jika tidak dikerjakan**: skip, tidak blokir MVP.

---

## M5 — CRUD Dashboard (Mode Kelola) (1 jam)

**Tujuan**: Toggle "Mode Kelola" → halaman kelola produk (tambah/edit/hapus) + ringkasan.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M5.1 `src/ui/Dashboard.js` — render form + tabel + ringkasan | Form: nama (required), kategori select, harga number≥0, stok int≥0, deskripsi textarea, checkbox unggulan, input imageUrl; Tabel: kolom Nama, Kategori, Harga, Stok, Aksi; Ringkasan: total produk, total stok | `src/ui/Dashboard.js`, `src/style.css` |
| M5.2 `src/ui/Modal.js` (opsional) atau halaman terpisah `manage.html` — pilih **halaman terpisah** `manage.html` agar sederhana | Klik "Mode Kelola" → `location.href = 'manage.html'`; navbar tetap | `index.html`, `manage.html` (baru), `src/main.js` |
| M5.3 `manage.html` + `src/manage.js` — logika CRUD | Load `storage.load()` → isi tabel; Tambah valid → `storage.save()` → refresh tabel + ringkasan; Edit → prefill form → save; Hapus → `confirm()` → delete → save; Validasi harga/stok ≥ 0 | `manage.html`, `src/manage.js`, `src/utils/storage.js` |
| M5.4 Tombol "Kembali ke Katalog" → `index.html` | Navigasi bolak-balik tanpa hilang data | `manage.html` |
| M5.5 Ringkasan hitung otomatis dari data | `totalProduk = data.length`, `totalStok = data.reduce((a,b)=>a+b.stok,0)` | `src/manage.js` |

**Definition of Done M5**: AC-7, AC-8, AC-9, AC-10 lulus manual.

---

## M6 — localStorage & Seed Ulang (30 menit)

**Tujuan**: Data persist refresh; tombol Reset data.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M6.1 `storage.load()` → jika key tidak ada atau array kosong → `storage.reset()` (taruh seed) | Refresh halaman → 8 produk tetap ada | `src/utils/storage.js` |
| M6.2 Tombol "Reset data" di dashboard & katalog (footer) | Klik → `confirm()` → `storage.reset()` → re-render → 8 produk semula | `src/main.js`, `src/manage.js`, `src/ui/Catalog.js`, `src/ui/Dashboard.js` |
| M6.3 Setiap CRUD (M5) panggil `storage.save()` | Data konsisten antar tab | `src/manage.js` |
| M6.4 Seed 8 produk non-pribadi, foto placeholder | `grep` tidak ada nama/alamat asli | `src/data/seed.js` |

**Definition of Done M6**: AC-11, AC-14 lulus.

---

## M7 — Testing Manual (30 menit)

**Tujuan**: Verifikasi semua AC-1 s.d. AC-14.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M7.1 Checklist manual AC-1..AC-14 (buka SPEC.md §8) | Semua ✅; catat yang gagal → fix di M7.2 | (tidak ada file baru) |
| M7.2 Perbaiki bug yang ketemu | Console clean; tidak ada error runtime | File terkait bug |
| M7.3 Responsif test: 320px, 640px, 1024px, 1440px | Layout tidak pecah; grid kolom benar; teks terbaca | `src/style.css` |
| M7.4 Aksesibilitas cepat: tab navigation, fokus visible, kontras | Tab urut logis; outline `#E63946` 3px; kontras teks ≥ 4.5:1 | `src/style.css` |
| M7.5 `npm run build` → `dist/` terbentuk tanpa error | Build production sukses | `vite.config.js` (jika perlu) |

**Definition of Done M7**: Semua AC lulus, build clean.

---

## M8 — Security & Hygiene (15 menit)

**Tujuan**: Pastikan tidak ada API key, data pribadi, dependency berbahaya.

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M8.1 `grep -R "sk-\|api[_-]?key\|token\|secret" src/` → kosong | AC-13 lulus | (verifikasi saja) |
| M8.2 `grep -R "localhost\|127.0.0.1\|internal" src/` → hanya comment/seed | Tidak ada endpoint internal bocor | (verifikasi saja) |
| M8.3 `package.json` — hanya `vite` di `devDependencies`; tidak ada runtime dep | `npm ls` → hanya vite + esbuild dll | `package.json` |
| M8.4 `src/data/seed.js` — 8 item fiktif, tanpa nama/telepon/email asli | AC-14 lulus | `src/data/seed.js` |
| M8.5 `.gitignore` — `node_modules/`, `dist/`, `.env*`, `*.log` | Repo bersih | `.gitignore` (baru) |

**Definition of Done M8**: AC-13, AC-14 lulus; `npm ls` bersih.

---

## M9 — Build & Deployment Prep (15 menit)

**Tujuan**: Artefak siap deploy static hosting (Netlify/Vercel/GitHub Pages).

| Tugas | Acceptance Criteria | Berkas berubah |
|---|---|---|
| M9.1 `vite.config.js` — `base: './'` (relative paths) | `npm run build` → `dist/` buka langsung via `file://` atau static host | `vite.config.js` |
| M9.2 `index.html` & `manage.html` — `<meta name="viewport">`, `<title>RasaNusa</title>` | SEO minimal | `index.html`, `manage.html` |
| M9.3 `public/` — placeholder SVG `placeholder.svg` (4:3, #e0e0e0) untuk fallback `imageUrl` | Tidak ada request 404 gambar | `public/placeholder.svg` (baru) |
| M9.4 `README.md` — cara jalan: `npm i && npm run dev`, build: `npm run build`, deploy `dist/` | Dokumentasi minimal | `README.md` (baru) |
| M9.5 Test build: `npm run build && npx serve dist` → katalog & dashboard jalan | Production build OK | (verifikasi) |

**Definition of Done M9**: `dist/` siap upload; `README.md` ada.

---

## Ringkasan Milestone & Estimasi

| Milestone | Durasi | Output Utama |
|---|---|---|
| M0 Scaffold | 30 mnt | Proyek Vite jalan, util & seed siap |
| M1 Katalog | 60 mnt | 8 kartu produk responsif |
| M2 Search/Filter/Sort | 45 mnt | Toolbar interaktif |
| M3 WhatsApp | 30 mnt | Tombol WA terbuka benar |
| M4 Instagram (stretch) | 30 mnt | Opsional |
| M5 CRUD Dashboard | 60 mnt | Kelola produk + ringkasan |
| M6 localStorage & Reset | 30 mnt | Persist + reset |
| M7 Testing Manual | 30 mnt | Semua AC lulus |
| M8 Security | 15 mnt | Bebas API key & data pribadi |
| M9 Build & Deploy | 15 mnt | `dist/` + `README.md` |
| **Total** | **≈ 5.5–6 jam** | MVP siap demo |

---

## File Tree Target (Akhir)

```
rasanusa/
├── index.html
├── manage.html
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
├── public/
│   └── placeholder.svg
├── src/
│   ├── main.js
│   ├── manage.js
│   ├── style.css
│   ├── data/
│   │   └── seed.js
│   ├── ui/
│   │   ├── ProductCard.js
│   │   ├── Catalog.js
│   │   ├── Toolbar.js
│   │   └── Dashboard.js
│   └── utils/
│       ├── storage.js
│       ├── format.js
│       ├── id.js
│       └── filter.js
```

---

## Catatan Pelaksanaan

- **Jangan** nulis kode di fase ini — TASKS.md hanya rencana.
- Setiap milestone dikerjakan berurutan; M0–M3 wajib, M4 opsional, M5–M9 wajib.
- Gunakan `clarify` jika ada keputusan desain yang belum jelas (mis. modal vs halaman terpisah untuk dashboard — sudah dipilih `manage.html` di atas).
- Commit tiap milestone (opsional tapi disarankan).
- Waktu buffer 1.5 jam untuk debugging / polishing.