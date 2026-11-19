import { describe, expect, it, beforeEach } from "vitest";
import { validateProduct, validateProducts, loadProducts } from "../src/store.js";
import { filterProducts } from "../src/utils/filter.js";
import { buildWhatsAppUrl } from "../src/utils/whatsapp.js";
import { isValidImageUrl } from "../src/utils/dom.js";

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};

describe("XSS via imageUrl (image injection)", () => {
  it("imageUrl javascript: ditolak", () => {
    const errs = validateProduct({
      id: "X1",
      nama: "Laptop",
      harga: 100,
      stok: 1,
      kategori: "Laptop",
      deskripsi: "test",
      imageUrl: "javascript:alert(1)",
      unggulan: false,
    });
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((e) => e.includes("imageUrl"))).toBe(true);
  });

  it("imageUrl data: URI ditolak", () => {
    const errs = validateProduct({
      id: "X2",
      nama: "Mouse",
      harga: 50,
      stok: 1,
      kategori: "Aksesoris",
      deskripsi: "test",
      imageUrl: "data:text/html,<script>alert(1)</script>",
      unggulan: false,
    });
    expect(errs.some((e) => e.includes("imageUrl"))).toBe(true);
  });

  it("imageUrl vbscript: ditolak", () => {
    const errs = validateProduct({
      id: "X3",
      nama: "Keyboard",
      harga: 60,
      stok: 1,
      kategori: "Aksesoris",
      deskripsi: "test",
      imageUrl: "vbscript:msgbox(1)",
      unggulan: false,
    });
    expect(errs.some((e) => e.includes("imageUrl"))).toBe(true);
  });

  it("imageUrl https: diterima", () => {
    const errs = validateProduct({
      id: "X4",
      nama: "Monitor",
      harga: 500,
      stok: 2,
      kategori: "Periferal",
      deskripsi: "test",
      imageUrl: "https://example.com/img.png",
      unggulan: false,
    });
    expect(errs).toEqual([]);
  });

  it("imageUrl path relatif /diterima", () => {
    const errs = validateProduct({
      id: "X5",
      nama: "SSD",
      harga: 200,
      stok: 1,
      kategori: "Komponen",
      deskripsi: "test",
      imageUrl: "/images/ssd.png",
      unggulan: false,
    });
    expect(errs).toEqual([]);
  });
});

describe("filterProducts kategori tak valid", () => {
  it("kategori bukan array valid mengembalikan kosong", () => {
    const products = [
      { id: "P1", nama: "A", harga: 100, stok: 1, kategori: "Laptop", deskripsi: "d", imageUrl: "", unggulan: false },
    ];
    const result = filterProducts(products, { query: "", category: "BukanKategori", sort: "default" });
    expect(result).toEqual([]);
  });
});

describe("import JSON rusak fallback", () => {
  it("JSON bukan array fallback ke seed", () => {
    storage.set("rasanusa:products:v1", '{"tidak":["array"]}');
    const r = loadProducts();
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });

  it("JSON tidak valid fallback ke seed", () => {
    storage.set("rasanusa:products:v1", "bukan json");
    const r = loadProducts();
    expect(r.length).toBeGreaterThan(0);
  });
});

describe("buildWhatsAppUrl nomor telepon", () => {
  it("nomor valid +6281234567890", () => {
    const url = buildWhatsAppUrl("+6281234567890", { nama: "Laptop X", harga: 1000000, deskripsi: "test" });
    expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
  });

  it("nomor kosong throw", () => {
    expect(() => buildWhatsAppUrl("", { nama: "Laptop", harga: 1000, deskripsi: "" })).toThrow(/Invalid phone/);
  });

  it("nomor tanpa + throw", () => {
    expect(() => buildWhatsAppUrl("6281234567890", { nama: "Laptop", harga: 1000, deskripsi: "" })).toThrow(/Invalid phone/);
  });
});

describe("isValidImageUrl helper", () => {
  it("kosong diterima", () => { expect(isValidImageUrl("")).toBe(true); });
  it("http diterima", () => { expect(isValidImageUrl("http://example.com/img.png")).toBe(true); });
  it("https diterima", () => { expect(isValidImageUrl("https://example.com/img.png")).toBe(true); });
  it("path relatif diterima", () => { expect(isValidImageUrl("/img.png")).toBe(true); });
  it("javascript: ditolak", () => { expect(isValidImageUrl("javascript:alert(1)")).toBe(false); });
  it("data: URI ditolak", () => { expect(isValidImageUrl("data:text/html,x")).toBe(false); });
  it("vbscript: ditolak", () => { expect(isValidImageUrl("vbscript:msgbox(1)")).toBe(false); });
});