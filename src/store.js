import { products as seedProducts } from "./products.js";
import { isValidImageUrl } from "./utils/dom.js";

const KEY = "rasanusa:products:v1";

export const KATEGORI_VALID = ["Laptop", "Komponen", "Aksesoris", "Periferal"];

let lastNotice = null;

export function getNotice() {
  const n = lastNotice;
  lastNotice = null;
  return n;
}

function setNotice(message, type = "error") {
  lastNotice = { message, type };
}

export function isValidCategory(kategori) {
  return KATEGORI_VALID.includes(kategori);
}

// Validasi struktur + tipe tiap field. Kembalikan array pesan error (kosong = valid).
export function validateProduct(p) {
  const errors = [];
  if (!p || typeof p !== "object" || Array.isArray(p)) return ["produk harus berupa objek"];
  if (typeof p.id !== "string" || p.id.trim() === "") errors.push("id wajib string");
  if (typeof p.nama !== "string" || p.nama.trim() === "") errors.push("nama wajib diisi");
  if (typeof p.harga !== "number" || !Number.isFinite(p.harga) || p.harga < 0)
    errors.push("harga wajib angka >= 0");
  if (!Number.isInteger(p.stok) || p.stok < 0) errors.push("stok wajib integer >= 0");
  if (!isValidCategory(p.kategori))
    errors.push(`kategori harus salah satu: ${KATEGORI_VALID.join(", ")}`);
  if (typeof p.deskripsi !== "string") errors.push("deskripsi wajib string");
  if (typeof p.imageUrl !== "string") errors.push("imageUrl wajib string");
  if (typeof p.imageUrl === "string" && !isValidImageUrl(p.imageUrl))
    errors.push("imageUrl wajib URL https:/ atau path relatif (/...)");
  if (typeof p.unggulan !== "boolean") errors.push("unggulan wajib boolean");
  return errors;
}

export function validateProducts(raw) {
  if (!Array.isArray(raw)) return { ok: false, errors: ["data harus berupa array produk"] };
  const errors = [];
  const seen = new Set();
  raw.forEach((p, i) => {
    const errs = validateProduct(p);
    if (errs.length) errors.push(`produk[${i}]: ${errs.join(", ")}`);
    if (typeof p.id === "string") {
      if (seen.has(p.id)) errors.push(`produk[${i}]: id duplikat: ${p.id}`);
      seen.add(p.id);
    }
  });
  return errors.length ? { ok: false, errors } : { ok: true, products: raw };
}

export function loadProducts() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        setNotice("Data tersimpan rusak (JSON tidak valid). Data contoh telah dipulihkan.");
        saveProducts(structuredClone(seedProducts));
        return structuredClone(seedProducts);
      }
      const v = validateProducts(parsed);
      if (v.ok) {
        // Migrasi:isi imageUrl dari seed, dan buang produk RSN-007/008 yang sudah dihapus dari seed.
        const kept = structuredClone(v.products).filter((p) => {
          // izinkan produk tetap ada meski ID tidak di seed (mis. RSN-999 dari test).
          // hanya hapus yang id-nya RSN-007 atau RSN-008 (sudah tidak ada di products.js).
          if (/^RSN-00[78]$/.test(p.id)) return false;
          return true;
        });
        // isi imageUrl yang kosong dari seed correspond.
        const migrated = kept.map((p) => {
          const seed = seedProducts.find((s) => s.id === p.id);
          return { ...p, imageUrl: p.imageUrl || seed?.imageUrl || "" };
        });
        if (migrated.length !== kept.length) saveProducts(migrated);
        return migrated;
      }
      setNotice("Data tersimpan tidak valid strukturnya. Data contoh telah dipulihkan.");
      saveProducts(structuredClone(seedProducts));
      return structuredClone(seedProducts);
    }
  } catch {
    setNotice("Gagal membaca data tersimpan. Data contoh telah dipulihkan.");
  }
  return structuredClone(seedProducts);
}

export function saveProducts(list) {
  const v = validateProducts(list);
  if (!v.ok) throw new Error(`Data produk tidak valid: ${v.errors.join("; ")}`);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function resetProducts() {
  const seed = structuredClone(seedProducts);
  saveProducts(seed);
  return seed;
}

export function upsertProduct(list, product) {
  const errs = validateProduct(product);
  if (errs.length) throw new Error(errs.join("; "));
  if (list.some((p) => p.id === product.id)) {
    const next = list.map((p) => (p.id === product.id ? product : p));
    saveProducts(next);
    return next;
  }
  const next = [...list, product];
  saveProducts(next);
  return next;
}

export function deleteProduct(list, id) {
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) throw new Error(`produk ${id} tidak ditemukan`);
  saveProducts(next);
  return next;
}

export function exportProducts(list) {
  return JSON.stringify(list, null, 2);
}

// Import JSON: parse + validasi struktur/tipe. Lempar Error kalau tidak valid.
export function importProducts(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("File bukan JSON yang valid.");
  }
  const v = validateProducts(data);
  if (!v.ok) throw new Error("Import ditolak: " + v.errors.join("; "));
  saveProducts(data);
  return data;
}

export function generateId(list) {
  let max = 0;
  for (const p of list) {
    const m = /^RSN-(\d+)$/.exec(p.id || "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `RSN-${String(max + 1).padStart(3, "0")}`;
}