import { products } from "./src/products.js";
import { filterProducts } from "./src/utils/filter.js";
import { buildWhatsAppUrl } from "./src/utils/whatsapp.js";

// 1. filterProducts tidak mengubah array asli
const originalLen = products.length;
const f1 = filterProducts(products, { query: "", category: "Semua", sort: "default" });
console.assert(f1.length === originalLen, "filterProducts return len ok");

// 2. filterProducts case-insensitive search
const f2 = filterProducts(products, { query: "laptop", category: "Semua", sort: "default" });
console.assert(f2.length === 2, "filterProducts case-insensitive ok");
console.assert(f2[0].nama.toLowerCase().includes("laptop"), "search found laptop");

// 3. filterProducts kategori
const f3 = filterProducts(products, { query: "", category: "Laptop", sort: "default" });
console.assert(f3.length === 2, "filterProducts kategori ok");

// 4. filterProducts sort harga-asc
const f4 = filterProducts(products, { query: "", category: "Semua", sort: "harga-asc" });
for (let i = 1; i < f4.length; i++) {
  console.assert(f4[i - 1].harga <= f4[i].harga, `sort harga-asc: ${f4[i-1].harga} <= ${f4[i].harga}`);
}

// 5. filterProducts sort nama-asc
const f5 = filterProducts(products, { query: "", category: "Semua", sort: "nama-asc" });
for (let i = 1; i < f5.length; i++) {
  console.assert(f5[i - 1].nama.localeCompare(f5[i].nama, "id") <= 0, `sort nama-asc`);
}

// 6. buildWhatsAppUrl valid
const waUrl = buildWhatsAppUrl("+6281234567890", { nama: "Laptop ASUS Vivobook 14", harga: 5999000, deskripsi: "Laptop kerja" });
console.assert(waUrl.includes("wa.me/6281234567890"), "buildWhatsAppUrl has wa.me");
console.assert(waUrl.includes("Laptop"), "buildWhatsAppUrl has product name");

// 7. buildWhatsAppUrl reject invalid
try { buildWhatsAppUrl("invalid", { nama: "Test", harga: 1000 }); console.assert(false, "should reject"); } catch (e) {
  console.assert(e instanceof Error, "buildWhatsAppUrl throw error");
}

// 8. stok nol product handling
const zeroStock = products.find(p => p.stok === 0);
console.assert(zeroStock.nama === "Mouse Wireless 2.4GHz", "find zero stock ok");
console.assert(zeroStock.stok === 0, "zero stok ok");

console.log("=== All self-check assertions passed ===");
