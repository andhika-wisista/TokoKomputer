// Format internasional: tanda +, kode negara 1-3 digit, lalu 7-15 digit nomor.
// Spasi/tanda hubung diizinkan untuk keterbacaan dan dihapus saat divalidasi.
const PHONE_RE = /^\+\d{1,3}[\d\s-]{7,20}$/;

function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s-]/g, "").trim();
  return PHONE_RE.test(cleaned) && /^\+\d{8,18}$/.test(cleaned);
}

export function buildWhatsAppUrl(phone, product) {
  if (!isValidPhone(phone)) {
    throw new Error("Invalid phone number: " + phone);
  }
  const digits = phone.replace(/[\s-]/g, "").replace(/^\+/, "");
  const text = encodeURIComponent(
    `Halo, saya mau pesan ${product.nama} (Rp ${Number(product.harga || 0).toLocaleString("id-ID")}). ${product.deskripsi || ""}`.trim()
  );
  return `https://wa.me/${digits}?text=${text}`;
}