import { KATEGORI_VALID } from "../store.js";

export function filterProducts(products, { query = "", category = "Semua", sort = "default" }) {
  let result = [...products];

  // Search: case-insensitive di nama dan deskripsi
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter((p) =>
      p.nama.toLowerCase().includes(q) || p.deskripsi.toLowerCase().includes(q)
    );
  }

  // Filter kategori
  if (category !== "Semua" && !KATEGORI_VALID.includes(category)) {
    return [];
  }
  if (category !== "Semua") {
    result = result.filter((p) => p.kategori === category);
  }

  // Sorting
  switch (sort) {
    case "harga-asc":
      result.sort((a, b) => a.harga - b.harga);
      break;
    case "harga-desc":
      result.sort((a, b) => b.harga - a.harga);
      break;
    case "nama-asc":
      result.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
      break;
    case "nama-desc":
      result.sort((a, b) => b.nama.localeCompare(a.nama, "id"));
      break;
    default:
      // default: urutkan unggulan dulu, lalu id
      result.sort((a, b) => (b.unggulan === a.unggulan ? 0 : b.unggulan ? 1 : -1));
  }

  return result;
}