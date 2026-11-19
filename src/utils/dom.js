// Escape HTML untuk mencegah XSS dari data produk (termasuk hasil import JSON).
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Validasi imageUrl: kosong atau relatif (/...) atau http(s)://. Tolak skema berbahaya (javascript:, data:, vb.).
export function isValidImageUrl(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (v === "") return true;
  return /^(https?:\/\/|\/)/i.test(v);
}
