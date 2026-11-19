// Polyfill localStorage untuk Node.js
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { products } = await import("../src/products.js");
import { validateProducts, validateProduct, generateId, upsertProduct, deleteProduct, resetProducts, importProducts, exportProducts, KATEGORI_VALID } from "../src/store.js";
import { filterProducts } from "../src/utils/filter.js";
import { buildWhatsAppUrl } from "../src/utils/whatsapp.js";

let failed = 0;
function check(name, cond) {
  if (!cond) { failed++; console.error("FAIL:", name); }
  else console.log("OK:", name);
}

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failed++;
    console.error(`FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else console.log(`OK: ${msg}`);
}

// 1. Seed valid
check("seed valid", validateProducts(products).ok);

// 2. validateProduct required fields
check("nama kosong invalid", validateProduct({ id:"X", nama:"", harga:1, stok:1, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("harga negatif invalid", validateProduct({ id:"X", nama:"A", harga:-1, stok:1, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("harga string invalid", validateProduct({ id:"X", nama:"A", harga:"100", stok:1, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("stok float invalid", validateProduct({ id:"X", nama:"A", harga:100, stok:1.5, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("stok negatif invalid", validateProduct({ id:"X", nama:"A", harga:100, stok:-1, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("kategori tidak valid invalid", validateProduct({ id:"X", nama:"A", harga:100, stok:1, kategori:"Invalid", deskripsi:"", imageUrl:"", unggulan:false }).length > 0);
check("unggulan string invalid", validateProduct({ id:"X", nama:"A", harga:100, stok:1, kategori:"Laptop", deskripsi:"", imageUrl:"", unggulan:"true" }).length > 0);

// 3. validateProducts array kosong
check("array kosong valid", validateProducts([]).ok);

// 4. validateProducts duplikat id
check("duplikat id invalid", !validateProducts([{...products[0]}, {...products[0]}]).ok);

// 5. generateId
const nextId = generateId(products);
check("generateId format RSN-xxx", /^RSN-\d{3}$/.test(nextId));
assertEqual(generateId(products), `RSN-${String(Math.max(...products.map(p => Number(p.id.split("-")[1]))) + 1).padStart(3, "0")}`, "generateId increment");

// 6. upsertProduct
let list = [...products];
const newProd = { id: nextId, nama: "Test", harga: 5000, stok: 10, kategori: "Aksesoris", deskripsi: "test", imageUrl: "", unggulan: false };
list = upsertProduct(list, newProd);
check("upsertProduct menambah", list.length === products.length + 1);
const updated = { ...newProd, nama: "Test Updated", harga: 6000 };
list = upsertProduct(list, updated);
check("upsertProduct update", list.find(p => p.id === nextId).nama === "Test Updated");
assertEqual(list.find(p => p.id === nextId).harga, 6000, "harga updated");

// 7. deleteProduct
list = deleteProduct(list, nextId);
check("deleteProduct menghapus", list.length === products.length);
try { deleteProduct(list, nextId); check("delete not found throws", false); } catch (e) { check("deleteProduct throw on missing", true); }

// 8. resetProducts returns seed
const reset = resetProducts();
check("resetProducts returns array", Array.isArray(reset) && reset.length === products.length);

// 9. exportProducts returns JSON string
const json = exportProducts(products);
check("exportProducts string", typeof json === "string" && json.startsWith("["));
const parsed = JSON.parse(json);
assertEqual(parsed.length, products.length, "exportProducts roundtrip");

// 10. importProducts valid
const imported = importProducts(json);
check("importProducts valid", imported.length === products.length);

// 11. importProducts invalid JSON
try { importProducts("invalid json"); check("importProducts throws on bad JSON", false); } catch { check("importProducts throws on bad JSON", true); }

// 12. filterProducts case-insensitive search
check("filterProducts case-insensitive", filterProducts(products, { query: "laptop", category: "Semua", sort: "default" }).length === 2);
check("filterProducts search deskripsi", filterProducts(products, { query: "ssd", category: "Semua", sort: "default" }).length >= 1);

// 13. filterProducts kategori
const laptop = filterProducts(products, { query: "", category: "Laptop", sort: "default" });
check("filterProducts kategori Laptop", laptop.length === 2 && laptop.every(p => p.kategori === "Laptop"));

// 14. filterProducts sort harga-asc
const asc = filterProducts(products, { query: "", category: "Semua", sort: "harga-asc" });
for (let i = 1; i < asc.length; i++) check("filterProducts sort harga-asc", asc[i-1].harga <= asc[i].harga);

// 15. filterProducts sort nama-asc
const namaAsc = filterProducts(products, { query: "", category: "Semua", sort: "nama-asc" });
for (let i = 1; i < namaAsc.length; i++) check("filterProducts sort nama-asc", namaAsc[i-1].nama.localeCompare(namaAsc[i].nama, "id") <= 0);

// 16. filterProducts combined query + category + sort
const combined = filterProducts(products, { query: "a", category: "Laptop", sort: "harga-asc" });
check("filterProducts combined", combined.every(p => p.kategori === "Laptop" && p.nama.toLowerCase().includes("a")));

// 17. buildWhatsAppUrl valid
const waUrl = buildWhatsAppUrl("+6281234567890", { nama: "Test", harga: 10000, deskripsi: "desc" });
check("buildWhatsAppUrl has wa.me", waUrl.includes("wa.me/6281234567890"));
check("buildWhatsAppUrl has product name", waUrl.includes("Test"));

// 18. buildWhatsAppUrl invalid phone
try { buildWhatsAppUrl("invalid", { nama: "X", harga: 1 }); check("buildWhatsAppUrl throws invalid", false); } catch { check("buildWhatsAppUrl throws invalid", true); }

// 19. stok nol product
const zero = products.find(p => p.stok === 0);
check("zero stock exists", zero && zero.nama === "Mouse Wireless 2.4GHz");

// 20. KATEGORI_VALID
check("KATEGORI_VALID count 4", KATEGORI_VALID.length === 4);
check("KATEGORI_VALID includes Laptop", KATEGORI_VALID.includes("Laptop"));

console.log(`\n=== ${failed ? failed + " TESTS FAILED" : "ALL TESTS PASSED"} ===`);
if (failed) process.exit(1);