import { beforeEach, describe, expect, it, vi } from "vitest";
import { products } from "../src/products.js";
import { filterProducts } from "../src/utils/filter.js";
import { buildWhatsAppUrl } from "../src/utils/whatsapp.js";
import {
  KATEGORI_VALID,
  deleteProduct,
  generateId,
  getNotice,
  importProducts,
  loadProducts,
  saveProducts,
  validateProduct,
  validateProducts,
  addRecent,
  loadRecent,
  loadCompare,
  toggleCompare,
  clearCompare,
  loadOrders,
  addOrder,
  loadVoucherClaims,
  claimVoucher,
} from "../src/store.js";

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};

const base = () => ({
  id: "RSN-999",
  nama: "Produk Tes",
  harga: 1000,
  stok: 10,
  kategori: "Laptop",
  deskripsi: "deskripsi",
  imageUrl: "",
  unggulan: false,
});

beforeEach(() => localStorage.clear());

describe("filterProducts", () => {
  it("filter case-insensitive di nama", () => {
    const r = filterProducts(products, { query: "VIVOBOOK", category: "Semua", sort: "default" });
    expect(r.length).toBe(1);
    expect(r.every((p) => p.nama.toLowerCase().includes("vivobook"))).toBe(true);
  });

  it("filter kategori Laptop", () => {
    const r = filterProducts(products, { query: "", category: "Laptop", sort: "default" });
    expect(r.every((p) => p.kategori === "Laptop")).toBe(true);
    expect(r.length).toBe(2);
  });

  it("filter kategori tidak valid mengembalikan nol", () => {
    const r = filterProducts(products, { query: "", category: "BukanKategori", sort: "default" });
    expect(r.length).toBe(0);
  });

  it("sort harga ascending", () => {
    const r = filterProducts(products, { query: "", category: "Semua", sort: "harga-asc" });
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].harga).toBeLessThanOrEqual(r[i].harga);
    }
  });

  it("sort harga descending", () => {
    const r = filterProducts(products, { query: "", category: "Semua", sort: "harga-desc" });
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].harga).toBeGreaterThanOrEqual(r[i].harga);
    }
  });

  it("sort default menempatkan unggulan di atas", () => {
    const r = filterProducts(products, { query: "", category: "Semua", sort: "default" });
    const unggulan = r.filter((p) => p.unggulan);
    expect(unggulan.length).toBeGreaterThan(0);
    expect(r[0].unggulan).toBe(true);
  });

  it("query kosong mengembalikan semua produk", () => {
    const r = filterProducts(products, { query: "", category: "Semua", sort: "default" });
    expect(r).toHaveLength(products.length);
  });
});

describe("shopMenuStore", () => {
  it("simpan order dan klaim voucher", () => {
    expect(addOrder({ total: 1000, items: [] })).toHaveLength(1);
    expect(loadOrders()[0].status).toBe("Menunggu pembayaran");
    expect(claimVoucher("HEMAT10")).toBe(true);
    expect(loadVoucherClaims()).toContain("HEMAT10");
    expect(claimVoucher("HEMAT10")).toBe(false);
  });
});

describe("compareProducts", () => {
  it("tambah produk, batasi 3, tidak duplikat", () => {
    let list = loadCompare();
    list = toggleCompare(list, "RSN-001");
    list = toggleCompare(list, "RSN-002");
    expect(list).toEqual(["RSN-001", "RSN-002"]);
    list = toggleCompare(list, "RSN-003");
    list = toggleCompare(list, "RSN-004");
    expect(list).toHaveLength(3);
    list = toggleCompare(list, "RSN-005");
    expect(list).not.toContain("RSN-005");
  });

  it("hapus produk dari compare", () => {
    let list = loadCompare();
    list = toggleCompare(list, "RSN-001");
    list = toggleCompare(list, "RSN-001");
    expect(list).toHaveLength(0);
  });
});

describe("validateProduct", () => {
  it("produk lengkap valid", () => {
    expect(validateProduct(base())).toEqual([]);
  });

  it("harga 0 valid, negatif invalid", () => {
    expect(validateProduct({ ...base(), harga: 0 })).toEqual([]);
    expect(validateProduct({ ...base(), harga: -0.01 })).toContain("harga wajib angka >= 0");
  });

  it("harga NaN dan Infinity invalid", () => {
    expect(validateProduct({ ...base(), harga: Number.NaN })).toContain("harga wajib angka >= 0");
    expect(validateProduct({ ...base(), harga: Number.POSITIVE_INFINITY })).toContain("harga wajib angka >= 0");
  });

  it("stok 0 valid, float dan negatif invalid", () => {
    expect(validateProduct({ ...base(), stok: 0 })).toEqual([]);
    expect(validateProduct({ ...base(), stok: 1.5 })).toContain("stok wajib integer >= 0");
    expect(validateProduct({ ...base(), stok: -1 })).toContain("stok wajib integer >= 0");
  });

  it("kategori tidak valid", () => {
    const errors = validateProduct({ ...base(), kategori: "Sembako" });
    expect(errors.some((e) => e.includes("kategori harus salah satu"))).toBe(true);
  });

  it("kategori valid", () => {
    for (const kategori of KATEGORI_VALID) {
      expect(validateProduct({ ...base(), kategori })).toEqual([]);
    }
  });
});

describe("validateProducts", () => {
  it("tolak data bukan array", () => {
    const r = validateProducts("bukan array");
    expect(r.ok).toBe(false);
  });

  it("tolak produk id duplikat", () => {
    const r = validateProducts([base(), { ...base(), nama: "Lain" }]);
    expect(r.ok).toBe(false);
  });

  it("array kosong valid", () => {
    expect(validateProducts([]).ok).toBe(true);
  });
});

describe("buildWhatsAppUrl", () => {
  const product = { nama: "Laptop ASUS Vivobook 14", harga: 5999000, deskripsi: "Laptop kerja" };

  it("nomor internasional valid menghasilkan URL wa.me", () => {
    const url = buildWhatsAppUrl("+6281234567890", product);
    expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
  });

  it("spasi dan strip pada nomor diizinkan", () => {
    const url = buildWhatsAppUrl("+62 812-3456-7890", product);
    expect(url).toContain("wa.me/6281234567890");
  });

  it("nomor tanpa plus ditolak", () => {
    expect(() => buildWhatsAppUrl("6281234567890", product)).toThrow(/Invalid phone number/);
  });

  it("nomor kosong dan karakter aneh ditolak", () => {
    expect(() => buildWhatsAppUrl("", product)).toThrow(/Invalid phone number/);
    expect(() => buildWhatsAppUrl("+628****7890", product)).toThrow(/Invalid phone number/);
  });
});

describe("localStorage parser", () => {
  it("mengembalikan seed saat localStorage kosong", () => {
    const r = loadProducts();
    expect(r).toHaveLength(products.length);
    expect(getNotice()).toBeNull();
  });

  it("mengembalikan seed saat payload bukan JSON", () => {
    localStorage.setItem("rasanusa:products:v1", "bukan json");
    const r = loadProducts();
    expect(r).toHaveLength(products.length);
    expect(getNotice()?.type).toBe("error");
  });

  it("mengembalikan seed saat payload valid JSON tapi struktur salah", () => {
    localStorage.setItem("rasanusa:products:v1", JSON.stringify({ bukan: "array" }));
    const r = loadProducts();
    expect(r).toHaveLength(products.length);
    expect(getNotice()?.type).toBe("error");
  });

  it("mengembalikan seed saat payload valid tapi produk invalid", () => {
    localStorage.setItem("rasanusa:products:v1", JSON.stringify([{ id: "X", nama: "" }]));
    const r = loadProducts();
    expect(r).toHaveLength(products.length);
    expect(getNotice()?.type).toBe("error");
  });

  it("mengembalikan data valid dan tidak mengubahnya", () => {
    const valid = [base()];
    localStorage.setItem("rasanusa:products:v1", JSON.stringify(valid));
    const r = loadProducts();
    expect(r).toHaveLength(1);
    expect(r[0].nama).toBe("Produk Tes");
  });

  it("importProducts meng-overwrite data lama", () => {
    importProducts(JSON.stringify([base()]));
    expect(loadProducts()).toHaveLength(1);
    expect(loadProducts()[0].nama).toBe("Produk Tes");
  });
});
