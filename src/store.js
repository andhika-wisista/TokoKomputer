import { products as seedProducts } from "./products.js";
import { isValidImageUrl } from "./utils/dom.js";
import { installmentPlans, shippingCosts } from "./data-extended.js";

const KEY = "rasanusa:products:v1";
const CART_KEY = "rasanusa:cart:v1";
const WISHLIST_KEY = "rasanusa:wishlist:v1";
const ORDERS_KEY = "rasanusa:orders:v1";
const VOUCHER_KEY = "rasanusa:vouchers:v1";
const ALERTS_KEY = "rasanusa:stock-alerts:v1";

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

// Normalisasi field opsional (brand, rating, badge, specs, reviews) dengan default aman.
export function normalizeProduct(p) {
  if (!p || typeof p !== "object") return p;
  return {
    ...p,
    brand: typeof p.brand === "string" && p.brand.trim() ? p.brand : "Umum",
    rating: typeof p.rating === "number" && p.rating >= 0 && p.rating <= 5 ? p.rating : 0,
    reviewCount: Number.isInteger(p.reviewCount) && p.reviewCount >= 0 ? p.reviewCount : 0,
    badge: ["sale", "bestseller", "new"].includes(p.badge) ? p.badge : null,
    originalPrice: typeof p.originalPrice === "number" && p.originalPrice > 0 ? p.originalPrice : null,
    specs: p.specs && typeof p.specs === "object" && !Array.isArray(p.specs) ? p.specs : {},
    reviews: Array.isArray(p.reviews) ? p.reviews.filter((r) => r && typeof r === "object") : [],
  };
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
        const kept = structuredClone(v.products).filter((p) => !/^RSN-00[78]$/.test(p.id));
        const migrated = kept.map((p) => {
          const seed = seedProducts.find((s) => s.id === p.id);
          return normalizeProduct({ ...p, imageUrl: p.imageUrl || seed?.imageUrl || "" });
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
  const existing = list.find((p) => p.id === product.id);
  // Edit: gabung dengan data lama agar field opsional (specs/reviews/brand) tidak hilang.
  const merged = normalizeProduct(existing ? { ...existing, ...product } : product);
  if (existing) {
    const next = list.map((p) => (p.id === merged.id ? merged : p));
    saveProducts(next);
    return next;
  }
  const next = [...list, merged];
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

export function importProducts(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("File bukan JSON yang valid.");
  }
  const v = validateProducts(data);
  if (!v.ok) throw new Error("Import ditolak: " + v.errors.join("; "));
  const normalized = data.map(normalizeProduct);
  saveProducts(normalized);
  return normalized;
}

export function generateId(list) {
  let max = 0;
  for (const p of list) {
    const m = /^RSN-(\d+)$/.exec(p.id || "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `RSN-${String(max + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Cart (persisten di localStorage)
// ---------------------------------------------------------------------------
export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((i) => i && typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0);
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(cart, id, qty = 1) {
  const idx = cart.findIndex((i) => i.id === id);
  let next;
  if (idx >= 0) next = cart.map((i, k) => (k === idx ? { ...i, qty: i.qty + qty } : i));
  else next = [...cart, { id, qty }];
  saveCart(next);
  return next;
}

export function updateCartQty(cart, id, qty) {
  let next;
  if (qty <= 0) next = cart.filter((i) => i.id !== id);
  else next = cart.map((i) => (i.id === id ? { ...i, qty } : i));
  saveCart(next);
  return next;
}

export function removeFromCart(cart, id) {
  const next = cart.filter((i) => i.id !== id);
  saveCart(next);
  return next;
}

export function clearCart() {
  saveCart([]);
  return [];
}

export function cartCount(cart) {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(list, cart) {
  return cart.reduce((s, i) => {
    const p = list.find((x) => x.id === i.id);
    if (!p) return s;
    let price = p.harga;
    if (i.variantIdx !== undefined && p.variants && p.variants[i.variantIdx]) {
      price = p.variants[i.variantIdx].price;
    }
    return s + price * i.qty;
  }, 0);
}

export function loadOrders() {
  try {
    const data = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function addOrder(order) {
  const next = [{ ...order, id: `ORD-${Date.now()}`, createdAt: new Date().toISOString(), status: "Menunggu pembayaran" }, ...loadOrders()];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  return next;
}

export function loadVoucherClaims() {
  try {
    const data = JSON.parse(localStorage.getItem(VOUCHER_KEY) || "[]");
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

export function claimVoucher(code) {
  const claims = loadVoucherClaims();
  if (claims.includes(code)) return false;
  localStorage.setItem(VOUCHER_KEY, JSON.stringify([...claims, code]));
  return true;
}

// ---------------------------------------------------------------------------
// Wishlist (persisten di localStorage)
// ---------------------------------------------------------------------------
export function loadWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

const RECENT_KEY = "rasanusa:recent:v1";
const COMPARE_KEY = "rasanusa:compare:v1";
export function loadCompare() {
  try {
    const data = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
    return Array.isArray(data) ? data.filter((x) => typeof x === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}
export function toggleCompare(ids, id) {
  const next = ids.includes(id)
    ? ids.filter((x) => x !== id)
    : ids.length >= 3 ? ids : [...ids, id];
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  return next;
}
export function clearCompare() {
  localStorage.removeItem(COMPARE_KEY);
  return [];
}
export function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter((x) => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}
export function saveRecent(ids) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 6)));
}
export function addRecent(ids, id) {
  const next = [id, ...ids.filter((x) => x !== id)].slice(0, 6);
  saveRecent(next);
  return next;
}

export function saveWishlist(ids) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
}

export function toggleWishlist(ids, id) {
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  saveWishlist(next);
  return next;
}

export function isInWishlist(ids, id) {
  return ids.includes(id);
}

export function getBrands(list) {
  return [...new Set(list.map((p) => p.brand).filter(Boolean))].sort();
}

export function loadStockAlerts() {
  try {
    const data = JSON.parse(localStorage.getItem(ALERTS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function addStockAlert(productId, email) {
  const alerts = loadStockAlerts();
  if (alerts.some((a) => a.productId === productId && a.email === email)) return false;
  alerts.push({ productId, email, createdAt: new Date().toISOString() });
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  return true;
}

export function addReview(productId, review) {
  const list = loadProducts();
  const p = list.find((x) => x.id === productId);
  if (!p) return false;
  if (!Array.isArray(p.reviews)) p.reviews = [];
  p.reviews.push({ nama: "Pembeli", tanggal: new Date().toISOString().slice(0, 10), helpful: 0, ...review });
  p.reviewCount = p.reviews.length;
  p.rating = Number((p.reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / p.reviews.length).toFixed(1));
  saveProducts(list);
  return true;
}

// ---------------------------------------------------------------------------
// Loyalitas — tier + poin
// ---------------------------------------------------------------------------
const LOYALTY_KEY = "rasanusa:loyalty:v1";

export function loadLoyalty() {
  try {
    return JSON.parse(localStorage.getItem(LOYALTY_KEY)) || { points: 0 };
  } catch {
    return { points: 0 };
  }
}

export function addPoints(n) {
  const l = loadLoyalty();
  l.points = Math.max(0, (l.points || 0) + n);
  localStorage.setItem(LOYALTY_KEY, JSON.stringify(l));
  return l.points;
}

export function loyaltyTier(points) {
  if (points >= 2000) return { name: "Platinum", next: null, color: "#8b5cf6" };
  if (points >= 1000) return { name: "Gold", next: 2000, color: "#f59e0b" };
  if (points >= 400) return { name: "Silver", next: 1000, color: "#94a3b8" };
  return { name: "Bronze", next: 400, color: "#b45309" };
}


// Installment calculator
export function calcInstallment(price, months) {
  const plan = installmentPlans.find((p) => p.months === months);
  if (!plan || price < plan.minAmount) return null;
  const monthlyPayment = price / months * (1 + plan.monthlyRate * months);
  return Math.round(monthlyPayment);
}

// Shipping calculator
export function calcShipping(city, method) {
  const costs = shippingCosts[city] || shippingCosts.Default;
  return costs[method] || 0;
}

// Recommendation engine — score products by similarity & history
export function scoreRecommendations(currentProduct, allProds, recentIds = []) {
  return allProds
    .filter((p) => p.id !== currentProduct.id)
    .map((p) => {
      let score = 0;
      if (p.kategori === currentProduct.kategori) score += 40;
      if (p.brand === currentProduct.brand) score += 30;
      if (Math.abs(p.harga - currentProduct.harga) < currentProduct.harga * 0.3) score += 20;
      if (recentIds.includes(p.id)) score += 15;
      if (p.rating >= 4.5) score += 10;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

// Select variant by index
export function selectVariant(product, variantIndex) {
  if (!product.variants || variantIndex < 0 || variantIndex >= product.variants.length) {
    return { name: "", price: product.harga, stock: product.stok };
  }
  return product.variants[variantIndex];
}

// Calculate checkout totals: subtotal, shipping, discount, tax, total
export function calculateCheckout(cart, products, options = {}) {
  const { shipping = 0, discount = 0, taxRate = 0 } = options;
  
  const subtotal = cart.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.id);
    return sum + (prod ? prod.harga * item.qty : 0);
  }, 0);
  
  const taxableAmount = subtotal - discount + shipping;
  const tax = Math.round(taxableAmount * taxRate);
  const total = subtotal - discount + shipping + tax;
  
  return { subtotal, shipping, discount, tax, total };
}
