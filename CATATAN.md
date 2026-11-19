# CATATAN PROYEK TOKOKOMPUTER / RASANUSA

**Terakhir diperbarui:** 2026-11-19

---

## 1. ISI (RINGKASAN KONTEN)

### Produk Katalog (6 item tokokomputer)
| ID | Nama | Kategori | Harga | Stok | Foto |
|----|------|----------|-------|------|------|
| RSN-001 | Laptop ASUS Vivobook 14 | Laptop | Rp 5.999.000 | 12 | laptop-asus.png |
| RSN-002 | Laptop Lenovo IdeaPad Slim 3 | Laptop | Rp 5.499.000 | 8 | laptop-lenovo.png |
| RSN-003 | Monitor LED 24 Inch HDMI | Periferal | Rp 1.250.000 | 15 | monitor-led.png |
| RSN-004 | Keyboard Mechanical RGB | Aksesoris | Rp 450.000 | 25 | keyboard-mechanical.png |
| RSN-005 | Mouse Wireless 2.4GHz | Aksesoris | Rp 150.000 | 0 (habis) | mouse-wireless.png |
| RSN-006 | SSD NVMe 512GB | Komponen | Rp 675.000 | 30 | ssd-nvme.png |

**Catatan:** Produk RSN-007 (RAM DDR4) dan RSN-008 (Printer Inkjet) **dihapus** dari seed & katalog.

### Struktur Aplikasi
- `src/main.js` — Entry point, load products, render shell/catalog/dashboard
- `src/products.js` — Seed data 6 produk
- `src/store.js` — State management, `loadProducts`, `validateProduct`, migrasi localStorage, `KATEGORI_VALID`
- `src/ui.js` — Render katalog, shell, dashboard, WhatsApp URL builder
- `src/dashboard.js` — Form dashboard admin (tambah/edit/hapus produk)
- `src/utils/filter.js` — `filterProducts` (search, kategori, sort)
- `src/utils/whatsapp.js` — `buildWhatsAppUrl` dengan validasi nomor
- `src/utils/dom.js` — `isValidImageUrl()` proteksi XSS
- `src/style.css` — Styling (hero 342px, typography, object-fit: contain, dark mode)

### File Gambar (public/images/)
```
laptop-asus.png
laptop-lenovo.png
monitor-led.png
keyboard-mechanical.png
mouse-wireless.png
ssd-nvme.png
```
*(6 file PNG, SVG lama sudah dihapus)*

### Test Suite
- `tests/unit.test.js` — 26 test regresi (filterProducts, validateProduct, buildWhatsAppUrl, parser localStorage)
- `tests/security.test.js` — 18 test keamanan (XSS imageUrl, kategori invalid, payload rusak, nomor WA)
- **Total: 44 test, 100% lolos**

---

## 2. KENDALA (MASALAH YANG DITEMUKAN)

| No | Kendala | Status |
|----|---------|--------|
| 1 | `write_file` menolak overwrite `src/products.js` (file sudah dibaca sebelumnya) | ✅ Di-atasi dengan `patch` per-block |
| 2 | Kategori makanan/minuman (SNACK, MINUMAN, MAKANAN, BUMBU) masih muncul di UI | ✅ Diperbaiki: `KATEGORI_VALID = ["Laptop","Komponen","Aksesoris","Periferal"]` |
| 3 | Checkbox "Unggulan" di form dashboard tidak bersebelahan dengan tombol lain, user minta dihapus | ✅ Dihapus total; state dipindah ke `fUnggulanState` di `dashboard.js` |
| 4 | Foto produk masih placeholder SVG abu-abu, user minta foto sesuai produk | ✅ 6 file PNG disalin dari screenshot user, referensi `imageUrl` diupdate |
| 5 | Migrasi localStorage terlalu agresif — menghapus produk test `RSN-999` | ✅ Diperbaiki: hanya hapus `RSN-007` & `RSN-008` via regex `^RSN-00[78]$` |
| 6 | `git push origin main` timeout di Windows (Git lambat) | ⏳ Commit lokal `9246338` sudah dibuat, perlu push manual ke GitHub |
| 7 | Vercel deploy butuh OAuth login (tidak bisa otomatis di sesi ini) | ⏳ Perlu login manual atau token di dashboard Vercel |
| 8 | Vision/gambar tidak bisa dianalisis di sesi ini (model lacks vision support) | ⏳ User harus deskripsikan gambar atau minta kode langsung |

---

## 3. HASIL TEST

### `npm test` (Vitest 4.1.3)
```
Test Files  2 passed (2)
Tests       44 passed (44)
Duration    288ms
```
**Breakdown:**
| Suite | Tests | Status |
|-------|-------|--------|
| `unit.test.js` (regresi) | 26 | ✅ Pass |
| `security.test.js` (keamanan) | 18 | ✅ Pass |

**Coverage kasus batas:**
- Harga negatif, nol, sangat besar
- Stok negatif, nol, non-integer
- Kategori di luar `KATEGORI_VALID` → kembalikan `[]`
- `imageUrl` berisi `javascript:`, `data:`, `vbscript:` → ditolak
- `localStorage` payload rusak (bukan array, field hilang, tipe salah)
- Nomor WA: format tidak valid, kosong, terlalu pendek, karakter aneh
- Sort: `harga-asc`, `harga-desc`, `nama-asc`, `nama-desc`
- Search case-insensitive

### `npm run build` (Vite 7.3.8)
```
✓ built in 196ms
dist/index.html                  0.40 kB │ gzip: 0.27 kB
dist/assets/index-CcekqaMO.css   8.15 kB │ gzip: 2.25 kB
dist/assets/index-BhcopxBL.js   17.58 kB │ gzip: 6.14 kB
```

### Verifikasi Browser (localhost:5173/#catalog)
- 6 kartu produk ter-render
- 6 gambar PNG loaded (naturalWidth > 0)
- 0 placeholder `.ph` tersisa
- Dropdown kategori menampilkan: "Semua", "Laptop", "Komponen", "Aksesoris", "Periferal"
- Produk stok 0 (Mouse Wireless) menampilkan badge "Stok Habis" + tombol disabled

---

## 4. PERBAIKAN PRIORITAS

### 🔴 TINGGI (Bloker deploy / fungsionalitas utama)
| No | Perbaikan | File Target | Estimasi |
|----|-----------|-------------|----------|
| 1 | Push commit `9246338` ke GitHub (manual) | — | 5 menit |
| 2 | Deploy ke Vercel via dashboard (import repo GitHub) | — | 10 menit |
| 3 | Verifikasi production URL (WhatsApp link, mobile viewport 390px) | Browser | 10 menit |

### 🟡 SEDANG (UX / Polish)
| No | Perbaikan | File Target | Estimasi |
|----|-----------|-------------|----------|
| 4 | Header lebih menarik: gradient text judul, hover animasi nav, mobile menu slide | `src/style.css`, `src/ui.js` | 30 menit |
| 5 | Tambah loading skeleton saat katalog dimuat | `src/ui.js`, `src/style.css` | 20 menit |
| 6 | Toast notifikasi posisi fixed top-right, auto-dismiss 3s | `src/ui.js` | 15 menit |
| 7 | Validasi form dashboard: required field, harga > 0, stok >= 0 | `src/dashboard.js` | 20 menit |

### 🟢 RENDAH (Nice to have)
| No | Perbaikan | File Target | Estimasi |
|----|-----------|-------------|----------|
| 8 | Pagination / infinite scroll katalog (>20 produk) | `src/ui.js`, `src/utils/filter.js` | 45 menit |
| 9 | Dark mode toggle di header (sudah ada CSS var, butuh toggle JS) | `src/ui.js`, `src/style.css` | 20 menit |
| 10 | Export/Import CSV produk di dashboard | `src/dashboard.js` | 30 menit |
| 11 | Unit test tambah: `renderCatalog`, `renderDashboard` (DOM testing) | `tests/dom.test.js` | 40 menit |
| 12 | CI/CD GitHub Actions: otomatis test + build + deploy Vercel | `.github/workflows/` | 30 menit |

---

## CATATAN TEKNIS TAMBAHAN

### Variabel Penting
```js
// src/ui.js
const WA_PHONE = "+628****7890";  // Masukkan nomor WA asli sebelum production

// src/store.js
export const KATEGORI_VALID = ["Laptop", "Komponen", "Aksesoris", "Periferal"];

// src/utils/dom.js
function isValidImageUrl(url) {
  // Terima: "", "/path", "https://..."
  // Tolak: "javascript:", "data:", "vbscript:"
}
```

### Perintah Berguna
```bash
npm run dev      # Dev server di http://127.0.0.1:5173
npm test         # Jalankan 44 test Vitest
npm run build    # Build production ke dist/
npm run preview  # Preview build production
```

### Git Status Saat Ini
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```
*Commit terakhir: `9246338` (belum di-push ke GitHub)*

---

**Next Action:** Push ke GitHub → Import ke Vercel → Verify production URL.