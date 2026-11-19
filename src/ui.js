import { getNotice, KATEGORI_VALID, loadCart, saveCart, addToCart, updateCartQty, removeFromCart, clearCart, loadWishlist, toggleWishlist, cartCount, cartTotal } from "./store.js";
import { escapeHtml } from "./utils/dom.js";
import { buildWhatsAppUrl } from "./utils/whatsapp.js";
import { products as allProducts } from "./products.js";

const WA_PHONE = "+628****7890";

// Ekspos toast ke dashboard
export function setToastHandler(fn) {
  window.showToast = fn;
}

// Shell global: navbar + dua panel (katalog & dashboard) + toast root
export function renderShell() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `<!-- Navbar -->
<header class="navbar">
  <div class="logo">Toko<span>komputer</span></div>
  <nav class="tabs" aria-label="Navigasi">
    <button type="button" class="tab active" data-view-tab="catalog">Katalog</button>
    <button type="button" class="tab" data-view-tab="cart">Keranjang <span class="nav-badge">0</span></button>
    <button type="button" class="tab" data-view-tab="wishlist">Wishlist <span class="nav-badge">0</span></button>
    <button type="button" class="tab" data-view-tab="dashboard">Dashboard Demo</button>
  </nav>
</header>

<!-- Root views -->
<main>
  <section id="view-catalog" data-view-panel></section>
  <section id="view-cart" data-view-panel hidden></section>
  <section id="view-wishlist" data-view-panel hidden></section>
  <section id="view-dashboard" data-view-panel hidden></section>
</main>

<!-- Footer -->
<footer class="footer">
  <p>2026 tokokomputer</p>
</footer>

<div id="toast-root" aria-live="polite"></div>`;

  // Nav tab click handler
  app.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.viewTab));
  });
}

// Global state kept in sync by renderCatalog etc.
let activeList = [];

export function showView(name) {
  const target = document.getElementById(`view-${name}`);
  if (!target) return;

  document.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.viewTab === name);
  });

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.hidden = panel.id !== `view-${name}`;
  });

  // Re‑render panels that depend on data
  if (name === "cart") renderCart(activeList);
  if (name === "wishlist") renderWishlist(activeList);
  renderBadges();
}

// Toast manual (bisa dipakai dari mana saja)
export function toast(message, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => el.remove());
  }, 4000);
}

// Filter products dari utils/filter.js
import { filterProducts } from "./utils/filter.js";

// Helper: render badge counts in navbar
function renderBadges() {
  const badges = document.querySelectorAll(".nav-badge");
  if (badges[0]) badges[0].textContent = cartCount(loadCart());
  if (badges[1]) badges[1].textContent = loadWishlist().length;
}

// Render Katalog lengkap dengan search, filter, grid, detail modal
export function renderCatalog(list) {
  activeList = list;
  const panel = document.getElementById("view-catalog");
  if (!panel) return;

  const notice = getNotice();
  const noticeHtml = notice
    ? `<div class="notice ${notice.type}" role="alert">${escapeHtml(notice.message)}</div>`
    : "";

  panel.innerHTML = `<section class="hero">
  <h1>Tokokomputer</h1>
  <p>Katalog produk pilihan dengan harga kompetitif, stok terpantau, dan pemesanan mudah lewat WhatsApp.</p>
  <a class="btn-primary" href="#catalog">Lihat Katalog</a>
</section>

${noticeHtml}

<section id="catalog" class="catalog-section">
  <div class="section-head">
    <h2>Katalog Produk</h2>
    <span class="count-badge">${list.length} produk</span>
  </div>
  <div class="toolbar">
    <input type="search" id="search-input" placeholder="Cari produk..." aria-label="Cari produk" />
    <div class="filter-group">
      <select id="category-select" aria-label="Filter kategori">
        <option value="Semua">Semua</option>
        ${KATEGORI_VALID.map((k) => `<option value="${k}">${k}</option>`).join("")}
      </select>
      <select id="sort-select" aria-label="Urutkan">
        <option value="default">Urutan Default</option>
        <option value="harga-asc">Harga Termurah</option>
        <option value="harga-desc">Harga Termahal</option>
        <option value="nama-asc">Nama A-Z</option>
        <option value="nama-desc">Nama Z-A</option>
      </select>
    </div>
  </div>
  <div id="catalog-grid" class="grid"></div>
</section>`;

  const grid = document.getElementById("catalog-grid");
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-select");
  const sortSelect = document.getElementById("sort-select");

  function renderItems(items) {
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>Tidak ada produk yang cocok dengan pencarian Anda.</p></div>`;
      return;
    }

    const wishlist = loadWishlist();
    grid.innerHTML = items.map((p) => {
      const discountHtml = p.originalPrice && p.originalPrice > p.harga
        ? `<span style="color:#666;font-weight:400;margin-left:0.5rem;text-decoration:line-through;">Rp ${p.originalPrice.toLocaleString("id-ID")}</span> `
        : "";
      const stars = Array.from({ length: 5 }, (_, i) => i < p.rating ? "★" : "☆").join("");
      const stokLabel = p.stok > 0 ? `Stok: ${p.stok}` : "Stok: 0 (Habis)";
      const disabled = p.stok <= 0 ? "disabled" : "";
      const badge = p.unggulan ? `<span class="badge">Unggulan</span>` : "";
      const heart = wishlist.includes(p.id) ? "♥" : "♡";

      return `<article class="card" data-id="${p.id}" style="cursor:pointer;">
        <div class="card-media" style="position:relative;">
          ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" />` : `<div class="ph" role="img" aria-label="placeholder foto ${escapeHtml(p.nama)}">Foto</div>`}
          <span class="wishlist-heart" data-id="${p.id}" title="Simpan ke wishlist"
            style="position:absolute;top:8px;left:8px;width:24px;height:24px;background:#fff;border:2px solid #e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;color:#2f855a;">${heart}</span>
        </div>
        <h3>${escapeHtml(p.nama)}</h3>
        <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " — " + escapeHtml(p.brand) : ""}</p>
        <p class="price">${discountHtml}Rp ${p.harga.toLocaleString("id-ID")}</p>
        <p class="stok">${stokLabel}</p>
        ${badge}
        <p style="font-size:0.85rem;color:#666;margin:0.2rem 0;">Rating: ${stars} (${p.reviewCount} ulasan)</p>
        <button class="wa" type="button" ${disabled} data-name="${escapeHtml(p.nama)}" data-price="${p.harga}" data-desc="${escapeHtml(p.deskripsi || "")}">Pesan via WhatsApp</button>
        <button class="btn-small add-to-cart" type="button" data-id="${p.id}" style="width:100%;margin-top:0.5rem;">Masukkan ke keranjang</button>
      </article>`;
    }).join("");
  }

  function update() {
    const q = searchInput.value.trim().toLowerCase();
    const cat = categorySelect.value;
    const sort = sortSelect.value;
    renderItems(filterProducts(list, { query: q, category: cat, sort }));
  }

  searchInput.addEventListener("input", update);
  categorySelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);

  grid.addEventListener("click", (e) => {
    const heart = e.target.closest(".wishlist-heart");
    if (heart) {
      e.stopPropagation();
      const id = heart.dataset.id;
      const next = toggleWishlist(loadWishlist(), id);
      heart.textContent = next.includes(id) ? "♥" : "♡";
      const p = allProducts.find((x) => x.id === id);
      toast(`${p ? p.nama : "Produk"} ${next.includes(id) ? "disimpan ke" : "dihapus dari"} wishlist`, "ok");
      if (name === "wishlist") renderWishlist(activeList);
      renderBadges();
      return;
    }

    const add = e.target.closest(".add-to-cart");
    if (add) {
      e.stopPropagation();
      const id = add.dataset.id;
      const p = allProducts.find((x) => x.id === id);
      if (!p) return;
      addToCart(loadCart(), id);
      toast(`${p.nama} dimasukkan ke keranjang.`, "ok");
      renderBadges();
      return;
    }

    const wa = e.target.closest(".wa");
    if (wa) {
      e.stopPropagation();
      if (wa.disabled) return;
      const product = { nama: wa.dataset.name, harga: Number(wa.dataset.price), deskripsi: wa.dataset.desc };
      try {
        window.open(buildWhatsAppUrl(WA_PHONE, product), "_blank");
      } catch (err) {
        toast("Error: " + err.message, "error");
      }
      return;
    }

    const article = e.target.closest("article[data-id]");
    if (article) {
      const p = allProducts.find((x) => x.id === article.dataset.id);
      if (p) openProductModal(p);
    }
  });

  update();
}

// --- Cart & Wishlist panels ---
function renderCart(list) {
  const panel = document.getElementById("view-cart");
  if (!panel) return;

  const total = cartTotal(allProducts, list);
  panel.innerHTML = `<div class="cart-panel">
    <h2>Keranjang Saya</h2>
    ${list.length === 0
      ? `<p>Keranjang kosong. <a href="#catalog">Lanjut berbelanja</a></p>`
      : `<table class="cart-table">
          <thead>
            <tr>
              <th>Nama</th><th>Harga</th><th>Qty</th><th>Total</th><th>Hapus</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((item) => {
              const p = allProducts.find((x) => x.id === item.id);
              const harga = p ? p.harga.toLocaleString("id-ID") : "—";
              return `<tr>
                <td>${escapeHtml(p ? p.nama : item.id)}</td>
                <td>Rp ${harga}</td>
                <td>
                  <input type="number" min="1" value="${item.qty}" data-id="${item.id}" class="qty-input" style="width:4rem;">
                </td>
                <td>Rp ${(harga * item.qty).toLocaleString("id-ID")}</td>
                <td><button class="btn-small danger hapus-dari-cart" data-id="${item.id}" style="width:100%;">Hapus</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`
      }
    }
    <div style="margin-top:1rem;">
      <span>Total: Rp ${total.toLocaleString("id-ID")}</span>
      <button class="btn-primary" style="width:100%;margin-top:0.5rem;">Bayar via WhatsApp</button>
    </div>
  </div>`;

  // Quantity update + remove
  panel.querySelectorAll(".qty-input").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const qty = Math.max(1, Number(inp.value));
      const id = inp.dataset.id;
      list = updateCartQty(list, id, qty);
      saveCart(list);
      renderCart(list);
      renderBadges();
    });
  });
  panel.querySelectorAll(".hapus-dari-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      list = removeFromCart(list, id);
      saveCart(list);
      renderCart(list);
      renderBadges();
    });
  });
  panel.querySelectorAll("button:last-child").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Build order summary for WhatsApp with last item maybe
      const last = list[list.length - 1];
      const p = allProducts.find((x) => x.id === last.id);
      const product = { nama: p ? p.nama : "Produk", harga: last.qty * (p ? p.harga : 0), deskripsi: `Qty: ${last.qty}` };
      try {
        window.open(buildWhatsAppUrl(WA_PHONE, product), "_blank");
      } catch (err) {
        toast("Error: " + err.message, "error");
      }
    });
  });
}

function renderWishlist(list) {
  const panel = document.getElementById("view-wishlist");
  if (!panel) return;

  panel.innerHTML = `<div class="wishlist-panel">
    <h2>Wishlist Saya</h2>
    ${list.length === 0
      ? `<p>Wishlist kosong.</p>`
      : `<ul class="wishlist-items">
          ${list.map((id) => {
            const p = allProducts.find((x) => x.id === id);
            if (!p) return "";
            const stars = Array.from({ length: 5 }, (_, i) => i < p.rating ? "★" : "☆").join("");
            return `<li style="display:flex;align-items:center;gap:0.5rem;">
              <span style="width:24px;height:24px;background:#fff;border:2px solid #e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;">${p.unggulan ? "★★" : "♡"}</span>
              <strong>${escapeHtml(p.nama)}</strong> (${p.kategori}) — Rp ${p.harga.toLocaleString("id-ID")}
            </li>`;
          }).join("")}
        </ul>`
    }
    <p style="margin-top:1rem;color:#666;">Total item: ${list.length}</p>
  </div>`;
}

// Run when DOM ready — called from main.js after renderShell
export function init() {
  // Load state from localStorage
  activeList = loadProducts(); // products list as base
  renderCatalog(activeList);
  renderBadges();
}
