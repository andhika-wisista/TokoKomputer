import {
  getNotice, KATEGORI_VALID, loadCart, saveCart, addToCart, updateCartQty,
  removeFromCart, clearCart, loadWishlist, toggleWishlist, cartCount, cartTotal,
  loadRecent, addRecent, loadCompare, toggleCompare, clearCompare,
  loadProducts, loadOrders, addOrder, loadVoucherClaims, claimVoucher, addStockAlert, addReview,
  loadLoyalty, addPoints, loyaltyTier, calcInstallment, calcShipping, scoreRecommendations
} from "./store.js";
import { WA_PHONE } from "./config.js";
import { escapeHtml } from "./utils/dom.js";
import { buildWhatsAppUrl } from "./utils/whatsapp.js";
import { products as allProducts } from "./products.js";
import { socialProof, deliveryZones, promoCodes, orderHistory, userAddresses, flashSales, bundleDeals, sellers, priceHistory, installmentPlans, shippingCosts, badges, productQa, loyaltyProgram, userLoyalty, paymentMethods } from "./data-extended.js";
import { filterProducts } from "./utils/filter.js";
import { getSession, isAdmin, logout } from "./auth.js";
import { renderLoginScreen } from "./login.js";

// Titik peta default & preset kota (bebas diubah user)
const TITIK_DEFAULT = { lat: -6.1944, lng: 106.8229, zoom: 15 };
const PRESET_TITIK = [
  { nama: "Jakarta Pusat", lat: -6.1944, lng: 106.8229 },
  { nama: "Surabaya", lat: -7.2575, lng: 112.7521 },
  { nama: "Bandung", lat: -6.9175, lng: 107.6191 },
  { nama: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
  { nama: "Medan", lat: 3.5952, lng: 98.6722 },
  { nama: "Denpasar", lat: -8.6705, lng: 115.2126 },
];
let titikSaatIni = { ...TITIK_DEFAULT };

const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const embedMap = (t) =>
  "https://maps.google.com/maps?q=" + encodeURIComponent(t.lat + "," + t.lng) +
  "&z=" + t.zoom + "&output=embed";
const linkMap = (t) =>
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t.lat + "," + t.lng);

function bintang(rating) {
  const r = Math.round(Number(rating) || 0);
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="${i < r ? "bintang-on" : "bintang-off"}">${i < r ? "★" : "☆"}</span>`
  ).join("");
}

export function setToastHandler(fn) {
  window.showToast = fn;
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------
export function renderShell() {
  const app = document.getElementById("app");
  if (!app) return;

  const session = getSession();
  document.body.dataset.role = session ? session.role : "guest";
  const userArea = session
    ? `<div class="nav-user">
         <span class="user-badge">${escapeHtml(session.nama)} · ${session.role === "admin" ? "Admin" : "User"}</span>
         <button type="button" class="btn-logout" data-action="logout">Keluar</button>
       </div>`
    : "";
  const dashboardTab = isAdmin(session)
    ? `<button type="button" class="tab" data-view-tab="dashboard">Dashboard</button>`
    : "";

  app.innerHTML = `
<div class="promo-strip">
  <span>Katalog komputer, komponen &amp; aksesoris</span>
  <span>Pesan praktis lewat WhatsApp</span>
</div>

<header class="navbar">
  <div class="logo">Toko<span>komputer</span></div>
  <button type="button" class="hamburger" aria-label="Buka menu" aria-expanded="false" aria-controls="main-navigation"><span></span><span></span><span></span></button>
  <nav id="main-navigation" class="tabs" aria-label="Navigasi">
    <button type="button" class="tab active" data-view-tab="catalog">Katalog</button>
    <button type="button" class="tab" data-view-tab="cart">Keranjang <span class="nav-badge">0</span></button>
    <button type="button" class="tab" data-view-tab="wishlist">Wishlist <span class="nav-badge">0</span></button>
    <button type="button" class="tab" data-view-tab="orders">Pesanan</button>
    <button type="button" class="tab" data-view-tab="vouchers">Voucher</button>
    <button type="button" class="tab" data-view-tab="profile">Profil</button>
    <button type="button" class="tab" data-view-tab="help">Bantuan</button>
    <button type="button" class="tab" data-view-tab="lokasi">Lokasi</button>
    ${dashboardTab}
  </nav>
  ${userArea}
</header>

<main>
  <section id="view-catalog" data-view-panel></section>
  <section id="view-cart" data-view-panel hidden></section>
  <section id="view-wishlist" data-view-panel hidden></section>
  <section id="view-orders" data-view-panel hidden></section>
  <section id="view-vouchers" data-view-panel hidden></section>
  <section id="view-profile" data-view-panel hidden></section>
  <section id="view-help" data-view-panel hidden></section>
  <section id="view-lokasi" data-view-panel hidden></section>
  <section id="view-dashboard" data-view-panel hidden></section>
</main>

<footer class="footer">
  <div class="footer-content">
    <span class="footer-brand">TokoKomputer.</span>
    <p class="footer-text">Penyedia hardware & aksesoris komputer terpercaya sejak 2026.</p>
    <p class="footer-copy">&copy; 2026 TokoKomputer. WA: <a href="https://wa.me/628****7890" class="wa-link">Chat Sales</a></p>
  </div>
</footer>

<div id="compare-bar" class="compare-bar" hidden aria-live="polite"></div>
<div id="toast-root" aria-live="polite"></div>
<div id="product-modal" class="modal" hidden></div>`;

  const hamburger = app.querySelector(".hamburger");
  const navigation = app.querySelector("#main-navigation");
  hamburger?.addEventListener("click", () => {
    const open = navigation.classList.toggle("menu-open");
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  });
  app.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.viewTab);
      navigation?.classList.remove("menu-open");
      hamburger?.setAttribute("aria-expanded", "false");
      hamburger?.setAttribute("aria-label", "Buka menu");
    });
  });

  app.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.action === "logout") {
        logout();
        document.body.dataset.role = "guest";
        renderLoginScreen(() => window.__boot?.());
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProductModal();
  });

  renderLokasi();
}

let activeList = [];
let flashTimer = null;

export function showView(name) {
  const target = document.getElementById(`view-${name}`);
  if (!target) return;

  const session = getSession();
  const role = session?.role || "guest";
  if (name === "dashboard" && role !== "admin") {
    toast("Akses ditolak. Hanya admin.", "error");
    name = "catalog";
  }

  document.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.viewTab === name);
  });
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.hidden = panel.id !== `view-${name}`;
  });

  if (name === "cart") renderCart(loadCart());
  if (name === "wishlist") renderWishlist(loadWishlist());
  if (name === "orders") renderOrders();
  if (name === "vouchers") renderVouchers();
    if (name === "profile") renderProfile();
    if (name === "help") renderHelp();
  renderBadges();
    initLiveChat();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function initLiveChat() {
  if (document.getElementById("live-chat-launcher")) return;
  const chat = document.createElement("aside");
  chat.className = "live-chat";
  chat.innerHTML = `<button id="live-chat-launcher" class="chat-launcher" type="button" aria-expanded="false">💬 Bantuan</button><section class="chat-panel" hidden aria-label="Bantuan cepat"><header><strong>Asisten Toko</strong><button type="button" class="chat-close" aria-label="Tutup">×</button></header><div class="chat-messages"><p class="chat-bubble">Halo! Pilih topik bantuan:</p><button class="chat-topic" data-reply="Pilih produk lalu tekan Tambah ke keranjang. Checkout tersedia melalui WhatsApp.">Cara memesan</button><button class="chat-topic" data-reply="Stok dan detail tersedia di halaman produk. Hubungi admin untuk konfirmasi sebelum transfer.">Cek stok / garansi</button><a class="chat-wa" href="https://wa.me/6281234567890" target="_blank" rel="noopener">Chat admin WhatsApp</a></div></section>`;
  document.body.append(chat);
  const launcher = chat.querySelector("#live-chat-launcher");
  const panel = chat.querySelector(".chat-panel");
  launcher.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
  });
  chat.querySelector(".chat-close").addEventListener("click", () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
  });
  chat.querySelectorAll(".chat-topic").forEach((button) => button.addEventListener("click", () => {
    const bubble = document.createElement("p");
    bubble.className = "chat-bubble chat-answer";
    bubble.textContent = button.dataset.reply;
    chat.querySelector(".chat-messages").append(bubble);
  }));
}

export function toast(message, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.addEventListener("transitionend", () => el.remove());
  }, 4000);
}

function renderBadges() {
  const badges = document.querySelectorAll(".nav-badge");
  if (badges[0]) badges[0].textContent = cartCount(loadCart());
  if (badges[1]) badges[1].textContent = loadWishlist().length;
}

// ---------------------------------------------------------------------------
// Peta / Lokasi — titik bebas + preset kota + Google Maps embed
// ---------------------------------------------------------------------------
export function renderLokasi() {
  const panel = document.getElementById("view-lokasi");
  if (!panel) return;

  panel.innerHTML = `
<section class="lokasi-section">
  <div class="section-head">
    <div>
      <span class="eyebrow">Lokasi</span>
      <h2>Peta &amp; Titik Toko</h2>
    </div>
    <span class="count-badge">Titik bebas</span>
  </div>

  <div class="lokasi-layout">
    <div class="panel lokasi-control">
      <h3>Atur titik</h3>
      <p class="muted">Pilih kota atau masukkan koordinat sendiri. Titik bisa berada di mana saja.</p>

      <div class="preset-grid">
        ${PRESET_TITIK.map((k) => `<button type="button" class="chip chip-btn" data-preset-lat="${k.lat}" data-preset-lng="${k.lng}">${escapeHtml(k.nama)}</button>`).join("")}
      </div>

      <div class="koordinat-row">
        <label>Latitude
          <input id="map-lat" type="number" step="any" value="${titikSaatIni.lat}" />
        </label>
        <label>Longitude
          <input id="map-lng" type="number" step="any" value="${titikSaatIni.lng}" />
        </label>
        <label>Zoom
          <select id="map-zoom">
            ${[12, 13, 14, 15, 16, 17].map((z) => `<option value="${z}" ${z === titikSaatIni.zoom ? "selected" : ""}>${z}</option>`).join("")}
          </select>
        </label>
      </div>

      <div class="form-actions">
        <button type="button" id="map-terapkan" class="btn-primary">Terapkan titik</button>
        <a id="map-buka" class="btn-secondary" href="${linkMap(titikSaatIni)}" target="_blank" rel="noopener">Buka di Google Maps</a>
      </div>

      <div class="koordinat-info">
        <span class="muted">Titik saat ini</span>
        <strong id="map-info">${titikSaatIni.lat}, ${titikSaatIni.lng}</strong>
      </div>
    </div>

    <div class="panel lokasi-peta">
      <iframe id="map-frame" title="Peta lokasi" src="${embedMap(titikSaatIni)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>`;

  const latInput = panel.querySelector("#map-lat");
  const lngInput = panel.querySelector("#map-lng");
  const zoomSelect = panel.querySelector("#map-zoom");
  const frame = panel.querySelector("#map-frame");
  const info = panel.querySelector("#map-info");
  const buka = panel.querySelector("#map-buka");

  function terapkan() {
    const lat = Number(latInput.value);
    const lng = Number(lngInput.value);
    const zoom = Number(zoomSelect.value);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast("Latitude harus antara -90 dan 90.", "error");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast("Longitude harus antara -180 dan 180.", "error");
      return;
    }
    titikSaatIni = { lat, lng, zoom };
    frame.src = embedMap(titikSaatIni);
    buka.href = linkMap(titikSaatIni);
    info.textContent = lat + ", " + lng;
    const teaser = document.querySelector("#peta-teaser-frame");
    if (teaser) teaser.src = embedMap(titikSaatIni);
    toast("Titik peta diperbarui.", "ok");
  }

  panel.querySelector("#map-terapkan").addEventListener("click", terapkan);
  panel.querySelectorAll("[data-preset-lat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      latInput.value = btn.dataset.presetLat;
      lngInput.value = btn.dataset.presetLng;
      terapkan();
    });
  });
}

// ---------------------------------------------------------------------------
// Katalog — hero, layanan, filter/search/sort, grid, teaser peta
// ---------------------------------------------------------------------------
export function renderCatalog(list) {
  activeList = list;
  const panel = document.getElementById("view-catalog");
  if (!panel) return;

  const notice = getNotice();
  const noticeHtml = notice
    ? `<div class="notice ${notice.type}" role="alert">${escapeHtml(notice.message)}</div>`
    : "";
  const brands = [...new Set(list.map((p) => p.brand).filter(Boolean))].sort();
  const semuaUlasan = allProducts.flatMap((p) =>
    (p.reviews || []).map((r) => ({ ...r, produk: p.nama }))
  );
  const ulasanPilihan = [...semuaUlasan]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);
  const rataRating = allProducts.length
    ? (allProducts.reduce((s, p) => s + (Number(p.rating) || 0), 0) / allProducts.length).toFixed(1)
    : "0.0";
  const totalUlasan = allProducts.reduce((s, p) => s + (Number(p.reviewCount) || 0), 0);
    const recent = loadRecent();
    const promoProducts = allProducts
      .filter((p) => p.originalPrice && p.originalPrice > p.harga)
      .sort((a, b) => (b.originalPrice - b.harga) - (a.originalPrice - a.harga))
      .slice(0, 6);

  panel.innerHTML = `
<section class="hero">
  <div class="hero-inner">
    <span class="eyebrow">TokoKomputer · Katalog 2026</span>
    <h1>Semua kebutuhan komputer, <em>satu tempat.</em></h1>
    <p>Laptop, komponen, aksesoris, dan periferal pilihan. Stok terpantau, spesifikasi jelas, ulasan pelanggan, dan pemesanan langsung lewat WhatsApp.</p>
    <div class="hero-detail">
      <div class="hero-detail-item">
        <span class="hero-detail-num">01</span>
        <div><strong>Spesifikasi lengkap</strong><small>Setiap produk menampilkan detail teknis &amp; ulasan.</small></div>
      </div>
      <div class="hero-detail-item">
        <span class="hero-detail-num">02</span>
        <div><strong>Stok real-time</strong><small>Status stok jelas sebelum Anda memesan.</small></div>
      </div>
      <div class="hero-detail-item">
        <span class="hero-detail-num">03</span>
        <div><strong>Peta titik bebas</strong><small>Atur lokasi toko lewat koordinat atau preset kota.</small></div>
      </div>
    </div>
    <div class="hero-cta">
      <a class="btn-primary" href="#catalog">Jelajahi katalog</a>
      <button type="button" class="btn-secondary" data-goto-lokasi>Lihat peta lokasi</button>
    </div>
    <div class="hero-meta">
      <span><strong>${list.length}</strong> produk</span>
      <span><strong>${KATEGORI_VALID.length}</strong> kategori</span>
      <span><strong>${brands.length}</strong> merek</span>
    </div>
  </div>
  <div class="hero-art" aria-hidden="true">
    <div class="art-card art-1">CPU</div>
    <div class="art-card art-2">GPU</div>
    <div class="art-card art-3">SSD</div>
  </div>
</section>

${noticeHtml}

<div class="promo-carousel" aria-label="Promo bergerak">
  <button type="button" class="carousel-prev" aria-label="Promo sebelumnya">‹</button>
  <div class="carousel-track">
    ${promoProducts.slice(0, 3).map((p) => `
      <article class="carousel-card" data-id="${escapeHtml(p.id)}" tabindex="0">
        <div class="carousel-media" style="background: #e8f3ec">
          ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" />` : `<div class="ph">Foto</div>`}
        </div>
        <div class="carousel-body">
          <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price"><strong>${rupiah(p.harga)}</strong> <span class="hemat">Hemat ${rupiah(p.originalPrice - p.harga)}</span></p>
        </div>
      </article>
    `).join("")}
  </div>
  <button type="button" class="carousel-next" aria-label="Promo berikutnya">›</button>
</div>

<section class="flash-section" aria-label="Promo terbatas">
  <div class="flash-inner">
    <div class="flash-copy">
      <span class="flash-label">⚡ PROMO TERBATAS</span>
      <h2>Buruan sebelum kehabisan</h2>
      <p>Produk unggulan dengan stok terbatas. Hitung mundur promo berakhir:</p>
      <div class="flash-timer" id="flash-timer" aria-live="polite">Memuat...</div>
      <button type="button" class="btn-primary" data-flash-cta>Lihat produk promo</button>
    </div>
    <div class="flash-rail" aria-live="polite">
      ${promoProducts.slice(1, 4).map((p) => `
        <article class="flash-card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat ${escapeHtml(p.nama)}">
          <div class="flash-media" style="background: #e8f3ec">
            ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" />` : `<div class="ph">Foto</div>`}
          </div>
          <div class="flash-body">
            <p>${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
            <h3>${escapeHtml(p.nama)}</h3>
            <p class="price">${rupiah(p.harga)} <span class="hemat">Hemat ${rupiah(p.originalPrice - p.harga)}</span></p>
          </div>
        </article>
      `).join("")}
    </div>
  </div>
</section>

<section class="layanan-strip" aria-label="Keunggulan">
  <div class="layanan"><span class="layanan-ikon">01</span><div><strong>Stok terpantau</strong><small>Status stok tiap produk ditampilkan jelas.</small></div></div>
  <div class="layanan"><span class="layanan-ikon">02</span><div><strong>Spesifikasi lengkap</strong><small>Detail dan ulasan ada di tiap produk.</small></div></div>
  <div class="layanan"><span class="layanan-ikon">03</span><div><strong>Pesan via WhatsApp</strong><small>Langsung chat, tanpa proses rumit.</small></div></div>
  <div class="layanan"><span class="layanan-ikon">04</span><div><strong>Titik peta bebas</strong><small>Atur lokasi sesuai kebutuhan Anda.</small></div></div>
</section>

<section id="catalog" class="catalog-section">
  <div class="section-head">
    <div>
      <span class="eyebrow">Produk</span>
      <h2>Katalog Produk</h2>
    </div>
    <span class="count-badge">${list.length} produk</span>
  </div>

  <div class="kategori-chips" aria-label="Filter cepat kategori">
    <button type="button" class="chip chip-btn aktif" data-kategori-cepat="Semua">Semua</button>
    ${KATEGORI_VALID.map((k) => `<button type="button" class="chip chip-btn" data-kategori-cepat="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join("")}
    <button type="button" class="chip chip-btn" data-kategori-cepat="Promo">Promo</button>
  </div>

  <div class="toolbar">
    <div class="search-wrap">
      <input type="search" id="search-input" placeholder="Cari nama atau deskripsi produk..." aria-label="Cari produk" autocomplete="off" />
      <div id="search-suggestions" class="search-suggestions"></div>
    </div>
    <div class="filter-group">
      <select id="category-select" aria-label="Filter kategori">
        <option value="Semua">Semua kategori</option>
        ${KATEGORI_VALID.map((k) => `<option value="${k}">${k}</option>`).join("")}
        <option value="Promo">Promo diskon</option>
      </select>
      <select id="brand-select" aria-label="Filter merek">
        <option value="Semua">Semua merek</option>
        ${brands.map((b) => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("")}
      </select>
      <select id="sort-select" aria-label="Urutkan">
        <option value="default">Urutan default</option>
        <option value="harga-asc">Harga termurah</option>
        <option value="harga-desc">Harga termahal</option>
        <option value="nama-asc">Nama A-Z</option>
        <option value="nama-desc">Nama Z-A</option>
      </select>
    </div>
  </div>

  <div class="advanced-filters" id="advanced-filters">
    <button type="button" class="chip chip-btn" id="toggle-filters">Advanced Filters</button>
    <div class="advanced-filters-panel" id="advanced-filters-panel">
      <div class="filter-section">
        <label class="filter-label">Harga (max)</label>
        <input type="range" id="price-slider" min="0" max="10000000" step="100000" value="10000000" />
        <div class="price-display">Rp <span id="price-display">10.000.000</span></div>
      </div>
      <div class="filter-section">
        <label class="filter-label">Rating minimum</label>
        <div class="rating-slider">
          <input type="range" id="rating-slider" min="0" max="5" step="0.5" value="0" />
          <span id="rating-display" class="rating-display">≥ ${bintang(0)} 0</span>
        </div>
      </div>
      <div class="filter-section">
        <label class="filter-label">Stok</label>
        <div class="checkbox-group">
          <label><input type="checkbox" class="stock-filter" value="ada" checked /> Masih ada</label>
          <label><input type="checkbox" class="stock-filter" value="habis" /> Habis</label>
        </div>
      </div>
    </div>
  </div>

  <div id="catalog-grid" class="grid"></div>
</section>

<section class="unggulan-section catalog-section" aria-label="Produk unggulan">
  <div class="section-head">
    <div>
      <span class="eyebrow">Pilihan Editor</span>
      <h2>Produk Unggulan Minggu Ini</h2>
    </div>
    <span class="count-badge">Pilihan terbaik</span>
  </div>
  <div class="unggulan-rail">
    ${allProducts.filter((p) => p.unggulan).slice(0, 4).map((p) => `
      <article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(p.nama)}">
        <div class="card-media"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" /></div>
        <div class="card-body">
          <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price">${rupiah(p.harga)} ${p.originalPrice && p.originalPrice > p.harga ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>` : ""}</p>
          <div class="card-rating">${bintang(p.rating)} <span>${Number(p.rating).toFixed(1)} (${p.reviewCount})</span></div>
        </div>
      </article>
    `).join("")}
  </div>
</section>

<section class="bundle-section catalog-section" aria-label="Paket bundles">
  <div class="section-head">
    <div>
      <span class="eyebrow">Hemat Lebih Banyak</span>
      <h2>Paket Bundling</h2>
    </div>
    <span class="count-badge">Beli bareng, hemat</span>
  </div>
  <div class="bundle-grid">
    ${bundleDeals.map((b) => {
      const items = b.productIds.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean);
      return `<article class="bundle-card">
        <h3>${escapeHtml(b.name)}</h3>
        <div class="bundle-items">${items.map((p) => `<span class="bundle-item">${escapeHtml(p.nama)}</span>`).join("")}</div>
        <p class="bundle-price"><strong>${rupiah(b.bundlePrice)}</strong> <s>${rupiah(b.normalPrice)}</s></p>
        <p class="bundle-save">Hemat ${rupiah(b.savings)}</p>
        <button class="btn-primary" type="button" data-bundle="${escapeHtml(b.id)}">Lihat paket</button>
      </article>`;
    }).join("")}
  </div>
</section>

<section class="cara-pesan-section">
  <div class="section-head">
    <div>
      <span class="eyebrow">Alur Pemesanan</span>
      <h2>Cara pesan di TokoKomputer</h2>
    </div>
  </div>
  <div class="cara-pesan-grid">
    <article class="cara-pesan-card">
      <span class="step-num">1</span>
      <h4>Pilih produk</h4>
      <p>Telusuri katalog, bandingkan spesifikasi, stok, dan ulasan.</p>
    </article>
    <article class="cara-pesan-card">
      <span class="step-num">2</span>
      <h4>Chat WhatsApp</h4>
      <p>Klik pesan via WhatsApp untuk tanya stok &amp; negosiasi.</p>
    </article>
    <article class="cara-pesan-card">
      <span class="step-num">3</span>
      <h4>Konfirmasi &amp; kirim</h4>
      <p>Atur titik lokasi di peta, lalu pesanan diproses.</p>
    </article>
  </div>
</section>

<section class="ulasan-section">
  <div class="section-head">
    <div>
      <span class="eyebrow">Testimoni</span>
      <h2>Rating &amp; Ulasan Pelanggan</h2>
    </div>
    <span class="count-badge">${rataRating} / 5 · ${totalUlasan} ulasan</span>
  </div>
  <div class="ulasan-grid">
    ${ulasanPilihan.map((r) => `<article class="ulasan-card">
      <div class="ulasan-bintang">${bintang(r.rating)} <strong>${Number(r.rating).toFixed(1)}</strong></div>
      <p>"${escapeHtml(r.komentar || "")}"</p>
      <div class="ulasan-pembeli">
        <span class="ulasan-avatar">${escapeHtml((r.nama || "P").charAt(0))}</span>
        <div><strong>${escapeHtml(r.nama || "Pembeli")}</strong><small>${escapeHtml(r.produk || "")} · ${escapeHtml(r.tanggal || "")}</small></div>
      </div>
    </article>`).join("")}
  </div>
</section>

<section class="recent-section ${recent.length ? "" : "is-empty"}" aria-label="Produk terakhir dilihat">
  <div class="section-head">
    <div>
      <span class="eyebrow">Riwayat</span>
      <h2>Produk Terakhir Dilihat</h2>
    </div>
    <span class="count-badge">${recent.length} item</span>
  </div>
  <div class="unggulan-rail">
    ${recent.map((id) => {
      const p = allProducts.find((x) => x.id === id);
      if (!p) return "";
      return `<article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(p.nama)}">
        <div class="card-media"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" /></div>
        <div class="card-body">
          <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price">${rupiah(p.harga)} ${p.originalPrice && p.originalPrice > p.harga ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>` : ""}</p>
          <div class="card-rating">${bintang(p.rating)} <span>${Number(p.rating).toFixed(1)} (${p.reviewCount})</span></div>
        </div>
      </article>`;
    }).join("")}
  </div>
</section>

<section class="peta-teaser">
  <div class="peta-teaser-copy">
    <span class="eyebrow">Kunjungi kami</span>
    <h2>Lokasi di peta</h2>
    <p>Titik peta bisa diatur bebas. Pilih kota atau masukkan koordinat latitude dan longitude sendiri.</p>
    <button type="button" class="btn-primary" data-goto-lokasi>Atur titik di peta</button>
  </div>
  <div class="peta-teaser-map">
    <iframe id="peta-teaser-frame" title="Pratinjau peta lokasi" src="${embedMap(titikSaatIni)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
</section>`;

  panel.querySelectorAll(".unggulan-rail").forEach((rail) => {
      rail.addEventListener("click", (e) => {
        const card = e.target.closest("article[data-id]");
        if (!card) return;
        const p = allProducts.find((x) => x.id === card.dataset.id);
        if (p) {
          addRecent(loadRecent(), p.id);
          renderRecentSection();
          openProductModal(p);
        }
      });
    });

  panel.querySelectorAll("[data-goto-lokasi]").forEach((el) => {
    el.addEventListener("click", () => showView("lokasi"));
  });

  const grid = panel.querySelector("#catalog-grid");
  const searchInput = panel.querySelector("#search-input");
  const suggestBox = panel.querySelector("#search-suggestions");

  // Live search suggestions
  searchInput?.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!suggestBox) return;
    if (q.length < 2) { suggestBox.classList.remove("open"); suggestBox.innerHTML = ""; return; }
    const hits = allProducts
      .filter((p) => `${p.nama} ${p.brand || ""} ${p.kategori}`.toLowerCase().includes(q))
      .slice(0, 6);
    if (!hits.length) { suggestBox.classList.remove("open"); suggestBox.innerHTML = ""; return; }
    suggestBox.innerHTML = hits.map((p) => `<button type="button" class="suggest-item" data-suggest="${escapeHtml(p.id)}">
      <img src="${escapeHtml(p.imageUrl)}" alt="" loading="lazy" />
      <span class="suggest-text"><strong>${escapeHtml(p.nama)}</strong><small>${escapeHtml(p.kategori)} · ${rupiah(p.harga)}</small></span>
    </button>`).join("");
    suggestBox.classList.add("open");
    suggestBox.querySelectorAll("[data-suggest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prod = allProducts.find((x) => x.id === btn.dataset.suggest);
        suggestBox.classList.remove("open");
        searchInput.value = "";
        if (prod) { addRecent(loadRecent(), prod.id); renderRecentSection(); openProductModal(prod); }
      });
    });
  });
  document.addEventListener("click", (e) => {
    if (suggestBox && !e.target.closest(".search-wrap")) { suggestBox.classList.remove("open"); }
  });
  const categorySelect = panel.querySelector("#category-select");
  const brandSelect = panel.querySelector("#brand-select");
  const sortSelect = panel.querySelector("#sort-select");
  const priceSlider = panel.querySelector("#price-slider");
  const ratingSlider = panel.querySelector("#rating-slider");
  const toggleFilters = panel.querySelector("#toggle-filters");
  const filtersPanel = panel.querySelector("#advanced-filters-panel");

  toggleFilters?.addEventListener("click", () => {
    filtersPanel.classList.toggle("terbuka");
    toggleFilters.classList.toggle("aktif", filtersPanel.classList.contains("terbuka"));
  });
  priceSlider?.addEventListener("input", () => {
    panel.querySelector("#price-display").textContent = Number(priceSlider.value).toLocaleString("id-ID");
    update();
  });
  ratingSlider?.addEventListener("input", () => {
    panel.querySelector("#rating-display").innerHTML = `≥ ${bintang(ratingSlider.value)} ${ratingSlider.value}`;
    update();
  });
  panel.querySelectorAll(".stock-filter").forEach((cb) => cb.addEventListener("change", update));

  function renderItems(items) {
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state"><p>Tidak ada produk yang cocok. Coba ubah kata kunci atau filter.</p></div>`;
      return;
    }
    const wishlist = loadWishlist();
    grid.innerHTML = items.map((p) => {
      const diskon = p.originalPrice && p.originalPrice > p.harga
        ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>` : "";
      const stokLabel = p.stok > 0 ? `Stok ${p.stok}` : "Stok habis";
      const stokKelas = p.stok > 0 ? "stok-ada" : "stok-habis";
      const badge = p.unggulan ? `<span class="badge">Unggulan</span>` : "";
      const extraBadges = (badges[p.id] || []).map((b) => `<span class="badge badge-extra">${escapeHtml(b)}</span>`).join("");
            const heart = wishlist.includes(p.id) ? "♥" : "♡";
            const compared = loadCompare().includes(p.id);
      return `<article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(p.nama)}">
        <div class="card-media">
          ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" />` : `<div class="ph">Foto produk</div>`}
          <span class="wishlist-heart ${wishlist.includes(p.id) ? "aktif" : ""}" data-id="${escapeHtml(p.id)}" title="Wishlist">${heart}</span>
          ${badge}
          ${extraBadges}
        </div>
        <div class="card-body">
          <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price">${rupiah(p.harga)} ${diskon}</p>
          <div class="card-rating">${bintang(p.rating)} <span>${Number(p.rating).toFixed(1)} (${p.reviewCount})</span></div>
          <p class="stok ${stokKelas}">${stokLabel}</p>
          ${socialProof[p.id] ? `<p class="social-proof">${socialProof[p.id].views} dilihat · ${socialProof[p.id].soldThisWeek} terjual minggu ini</p>` : ""}
          <label class="compare-check"><input type="checkbox" data-compare-id="${escapeHtml(p.id)}" ${compared ? "checked" : ""} /> Bandingkan</label>
          <div class="card-actions">
            <button class="wa" type="button" ${p.stok <= 0 ? "disabled" : ""} data-id="${escapeHtml(p.id)}">Pesan via WhatsApp</button>
            <button class="btn-small add-to-cart" type="button" data-id="${escapeHtml(p.id)}" ${p.stok <= 0 ? "disabled" : ""}>Tambah ke keranjang</button>
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function update() {
    const q = searchInput.value.trim().toLowerCase();
    const brand = brandSelect.value;
    const kategori = categorySelect.value === "Promo" ? "Semua" : categorySelect.value;
    let hasil = filterProducts(list, {
      query: q,
      category: kategori,
      sort: sortSelect.value,
    });
    if (brand !== "Semua") hasil = hasil.filter((p) => p.brand === brand);
    if (categorySelect.value === "Promo") hasil = hasil.filter((p) => p.originalPrice && p.originalPrice > p.harga);

    const maxHarga = Number(priceSlider?.value || 10000000);
    if (maxHarga < 10000000) hasil = hasil.filter((p) => p.harga <= maxHarga);

    const minRating = Number(ratingSlider?.value || 0);
    if (minRating > 0) hasil = hasil.filter((p) => Number(p.rating) >= minRating);

    const boxes = [...panel.querySelectorAll(".stock-filter")];
    if (boxes.length) {
      const ada = boxes.find((b) => b.value === "ada")?.checked;
      const habis = boxes.find((b) => b.value === "habis")?.checked;
      if (ada !== habis) hasil = hasil.filter((p) => (ada ? p.stok > 0 : p.stok <= 0));
    }
    renderItems(hasil);
  }

  searchInput.addEventListener("input", update);
  categorySelect.addEventListener("change", () => {
    panel.querySelectorAll("[data-kategori-cepat]").forEach((c) =>
      c.classList.toggle("aktif", c.dataset.kategoriCepat === categorySelect.value)
    );
    update();
  });
  brandSelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);

  // Flash promo countdown
  if (flashTimer) clearInterval(flashTimer);
  const timerEl = panel.querySelector("#flash-timer");
  const deadlineKey = "rasanusa-promo-deadline";
  let deadline = Number(sessionStorage.getItem(deadlineKey) || 0);
  if (!deadline || deadline < Date.now()) {
    deadline = Date.now() + 3 * 60 * 60 * 1000;
    sessionStorage.setItem(deadlineKey, String(deadline));
  }
  function paintTimer() {
    const sisa = Math.max(0, deadline - Date.now());
    const h = Math.floor((sisa % 86400000) / 3600000);
    const m = Math.floor((sisa % 3600000) / 60000);
    const s = Math.floor((sisa % 60000) / 1000);
    timerEl.innerHTML = `
      <div class="flash-unit"><b>${String(h).padStart(2, "0")}</b><small>Jam</small></div>
      <div class="flash-unit"><b>${String(m).padStart(2, "0")}</b><small>Menit</small></div>
      <div class="flash-unit"><b>${String(s).padStart(2, "0")}</b><small>Detik</small></div>`;
    if (sisa <= 0) {
      clearInterval(flashTimer);
      sessionStorage.removeItem(deadlineKey);
    }
  }
  paintTimer();
  flashTimer = setInterval(paintTimer, 1000);

  // Carousel promo
  const carouselTrack = panel.querySelector(".carousel-track");
  const carouselCards = panel.querySelectorAll(".carousel-card");
  let carouselIndex = 0;
  function paintCarousel() {
    const step = 100;
    carouselTrack.style.transform = `translateX(-${carouselIndex * step}%)`;
  }
  panel.querySelector(".carousel-prev")?.addEventListener("click", () => {
    carouselIndex = Math.max(0, carouselIndex - 1);
    paintCarousel();
  });
  panel.querySelector(".carousel-next")?.addEventListener("click", () => {
    carouselIndex = Math.min(carouselCards.length - 1, carouselIndex + 1);
    paintCarousel();
  });

  // Flash rail: click card to open product modal
  panel.querySelectorAll(".flash-card").forEach((card) => {
    card.addEventListener("click", () => {
      const p = allProducts.find((x) => x.id === card.dataset.id);
      if (p) openProductModal(p);
    });
  });

  // Bundle deals: tambah semua item ke keranjang
  panel.querySelectorAll("[data-bundle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const deal = bundleDeals.find((b) => b.id === btn.dataset.bundle);
      if (!deal) return;
      deal.productIds.forEach((id) => {
        const p = allProducts.find((x) => x.id === id);
        if (p && p.stok > 0) addToCart(loadCart(), id, 1);
      });
      toast(`${deal.name} ditambahkan ke keranjang. Hemat ${rupiah(deal.savings)}.`, "ok");
      renderBadges();
    });
  });

  panel.querySelector("[data-flash-cta]")?.addEventListener("click", () => {
    categorySelect.value = "Promo";
    panel.querySelectorAll("[data-kategori-cepat]").forEach((c) => c.classList.toggle("aktif", c.dataset.kategoriCepat === "Promo"));
    update();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  panel.querySelectorAll("[data-kategori-cepat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      categorySelect.value = btn.dataset.kategoriCepat;
      panel.querySelectorAll("[data-kategori-cepat]").forEach((c) => c.classList.toggle("aktif", c === btn));
      update();
    });
  });

  grid.addEventListener("click", (e) => {
    const compare = e.target.closest("[data-compare-id]");
    if (compare) {
      e.stopPropagation();
      const next = toggleCompare(loadCompare(), compare.dataset.compareId);
      if (!compare.checked && next.includes(compare.dataset.compareId)) compare.checked = true;
      if (compare.checked && !next.includes(compare.dataset.compareId)) compare.checked = false;
      renderCompareBar();
      return;
    }
    const heart = e.target.closest(".wishlist-heart");
    if (heart) {
      e.stopPropagation();
      const id = heart.dataset.id;
      const next = toggleWishlist(loadWishlist(), id);
      heart.textContent = next.includes(id) ? "♥" : "♡";
      heart.classList.toggle("aktif", next.includes(id));
      const p = allProducts.find((x) => x.id === id);
      toast(`${p ? p.nama : "Produk"} ${next.includes(id) ? "disimpan ke" : "dihapus dari"} wishlist.`, "ok");
      renderBadges();
      return;
    }
    const add = e.target.closest(".add-to-cart");
    if (add) {
      e.stopPropagation();
      const id = add.dataset.id;
      const p = allProducts.find((x) => x.id === id);
      if (!p || p.stok <= 0) return;
      addToCart(loadCart(), id);
      toast(`${p.nama} masuk keranjang.`, "ok");
      renderBadges();
      return;
    }
    const wa = e.target.closest(".wa");
    if (wa) {
      e.stopPropagation();
      if (wa.disabled) return;
      const p = allProducts.find((x) => x.id === wa.dataset.id);
      if (p) bukaWhatsAppProduk(p);
      return;
    }
    const card = e.target.closest("article[data-id]");
    if (card) {
      const p = allProducts.find((x) => x.id === card.dataset.id);
      if (p) {
        addRecent(loadRecent(), p.id);
        renderRecentSection();
        openProductModal(p);
      }
    }
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest("article[data-id]");
    if (card && e.target === card) {
      e.preventDefault();
      const p = allProducts.find((x) => x.id === card.dataset.id);
      if (p) {
        addRecent(loadRecent(), p.id);
        renderRecentSection();
        openProductModal(p);
      }
    }
  });

  update();
  renderCompareBar();
}

function renderCompareBar() {
  const bar = document.getElementById("compare-bar");
  if (!bar) return;
  const ids = loadCompare();
  const items = ids.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean);
  bar.hidden = !items.length;
  bar.innerHTML = items.length ? `<strong>Bandingkan ${items.length}/3</strong>${items.map((p) => `<span>${escapeHtml(p.nama)}</span>`).join("")}<button type="button" class="btn-primary" data-open-compare>Lihat perbandingan</button><button type="button" class="btn-secondary" data-clear-compare>Kosongkan</button>` : "";
  bar.querySelector("[data-clear-compare]")?.addEventListener("click", () => { clearCompare(); renderCatalog(activeList); });
  bar.querySelector("[data-open-compare]")?.addEventListener("click", () => openCompareModal(items));
}

function openCompareModal(items) {
  const modal = document.getElementById("product-modal");
  if (!modal || !items.length) return;
  const keys = [...new Set(items.flatMap((p) => Object.keys(p.specs || {})))];
  modal.innerHTML = `<div class="modal-dialog compare-dialog" role="dialog" aria-modal="true"><button type="button" class="modal-close" data-modal-close aria-label="Tutup">×</button><h2>Perbandingan Produk</h2><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Spesifikasi</th>${items.map((p) => `<th>${escapeHtml(p.nama)}<br><strong>${rupiah(p.harga)}</strong></th>`).join("")}</tr></thead><tbody>${keys.map((k) => `<tr><th>${escapeHtml(k)}</th>${items.map((p) => `<td>${escapeHtml(String(p.specs?.[k] || "—"))}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modal.querySelector("[data-modal-close]").addEventListener("click", closeProductModal);
}

function bukaWhatsAppProduk(p) {
  try {
    window.open(buildWhatsAppUrl(WA_PHONE, {
      nama: p.nama,
      harga: p.harga,
      deskripsi: p.deskripsi || "",
    }), "_blank", "noopener");
  } catch (err) {
    toast("Gagal membuka WhatsApp: " + err.message, "error");
  }
}

// ---------------------------------------------------------------------------
// Detail produk — modal lengkap (specs, ulasan, produk terkait)
// ---------------------------------------------------------------------------
function renderRecentSection() {
  const recent = loadRecent();
  const section = document.querySelector(".recent-section");
  if (!section) return;
  if (!recent.length) {
    section.classList.add("is-empty");
    section.querySelector(".count-badge").textContent = "0 item";
    section.querySelector(".unggulan-rail").innerHTML = "";
    return;
  }
  section.classList.remove("is-empty");
  section.querySelector(".count-badge").textContent = `${recent.length} item`;
  section.querySelector(".unggulan-rail").innerHTML = recent.map((id) => {
    const p = allProducts.find((x) => x.id === id);
    if (!p) return "";
    return `<article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(p.nama)}">
      <div class="card-media"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" /></div>
      <div class="card-body">
        <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
        <h3>${escapeHtml(p.nama)}</h3>
        <p class="price">${rupiah(p.harga)} ${p.originalPrice && p.originalPrice > p.harga ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>` : ""}</p>
        <div class="card-rating">${bintang(p.rating)} <span>${Number(p.rating).toFixed(1)} (${p.reviewCount})</span></div>
      </div>
    </article>`;
  }).join("");
}

function bukaFoto(src) {
  let d = document.getElementById("foto-lightbox");
  if (!d) {
    d = document.createElement("dialog");
    d.id = "foto-lightbox";
    d.className = "foto-lightbox";
    d.innerHTML = `<img alt="Foto ulasan" /><button type="button" class="modal-close" aria-label="Tutup">×</button>`;
    d.addEventListener("click", (ev) => { if (ev.target === d) d.close(); });
    document.body.appendChild(d);
  }
  d.querySelector("img").src = src;
  d.showModal();
}

export function openProductModal(p) {
  const modal = document.getElementById("product-modal");
  if (!modal || !p) return;

  addRecent(loadRecent(), p.id);
  modal.dataset.id = p.id;
  const specs = Object.entries(p.specs || {});
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const qa = Array.isArray(p.qa) && p.qa.length ? p.qa : (productQa[p.id] || []);
  const recentIds = loadRecent().map((r) => (typeof r === "string" ? r : r.id));
  const related = scoreRecommendations(p, allProducts, recentIds).slice(0, 6);
  const wishlisted = loadWishlist().includes(p.id);
  const diskon = p.originalPrice && p.originalPrice > p.harga
    ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>
       <span class="hemat">Hemat ${rupiah(p.originalPrice - p.harga)}</span>` : "";
  const gallery = (p.gallery && p.gallery.length ? p.gallery : [p.imageUrl]).filter(Boolean);
  const proof = socialProof[p.id];
  const ratingDist = [5,4,3,2,1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length
  }));
  const maxCount = Math.max(1, ...ratingDist.map((d) => d.count));

  modal.innerHTML = `
<div class="modal-dialog modal-dialog-xl" role="dialog" aria-modal="true" aria-label="Detail ${escapeHtml(p.nama)}">
  <button type="button" class="modal-close" data-modal-close aria-label="Tutup">×</button>
  <div class="modal-grid">
    <div class="modal-media">
      <div class="modal-main-image" id="modal-main-image-wrap">${gallery[0] ? `<img id="modal-main-img" src="${escapeHtml(gallery[0])}" alt="${escapeHtml(p.nama)}" style="cursor: zoom-in;" />` : `<div class="ph">Foto produk</div>`}</div>
      <div class="modal-thumbs">
        ${gallery.map((src, i) => `<button type="button" class="thumb ${i===0?"aktif":""}" data-gallery-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="thumb ${i+1}" /></button>`).join("")}
      </div>
      ${p.videoUrl ? `<div class="modal-video"><iframe src="${escapeHtml(p.videoUrl)}" title="Video produk" loading="lazy" allowfullscreen></iframe></div>` : ""}
    </div>

    <div class="modal-info">
      <div class="modal-breadcrumb">Katalog / ${escapeHtml(p.kategori)} / ${escapeHtml(p.nama)}</div>
      <span class="eyebrow">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</span>
      <h2>${escapeHtml(p.nama)}</h2>
      <div class="modal-rating">${bintang(p.rating)} <strong>${Number(p.rating).toFixed(1)}</strong> <span class="muted">${p.reviewCount} ulasan</span></div>
      <div class="modal-harga">${rupiah(p.harga)} ${diskon}</div>
      <p class="stok ${p.stok > 0 ? "stok-ada" : "stok-habis"}">${p.stok > 0 ? "Stok tersedia: " + p.stok : "Stok habis"}</p>
      ${proof ? `<p class="social-proof"><strong>${proof.views}</strong> orang lihat · <strong>${proof.soldThisWeek}</strong> terjual minggu ini${proof.liveViewers ? ` · <span class="live-viewers">🔴 ${proof.liveViewers} sedang melihat</span>` : ""}</p>` : ""}

      ${sellers[p.id] ? `<div class="seller-info">
        <div class="seller-name"><strong>${sellers[p.id].name}</strong> <span class="seller-badge">⭐ ${sellers[p.id].rating}</span></div>
        <div class="seller-meta">Bergabung ${sellers[p.id].joinedYear} · ${sellers[p.id].totalSales.toLocaleString('id-ID')} produk terjual · Respon ${sellers[p.id].responseTime}</div>
      </div>` : ""}

      ${(() => {
        const fs = flashSales.find((f) => f.productId === p.id);
        if (!fs) return "";
        const now = new Date();
        const end = new Date(fs.endsAt);
        if (now >= end) return "";
        const diff = Math.floor((end - now) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return `<div class="flash-sale-banner">
          <span class="flash-icon">⚡</span>
          <div class="flash-info">
            <strong>Flash Sale ${rupiah(fs.flashPrice)}</strong>
            <span class="flash-savings">Hemat ${rupiah(fs.originalPrice - fs.flashPrice)}</span>
          </div>
          <div class="flash-timer" data-ends="${fs.endsAt}">
            <span class="timer-label">Berakhir dalam</span>
            <div class="timer-digits"><span class="digit-box">${String(h).padStart(2,"0")}</span>:<span class="digit-box">${String(m).padStart(2,"0")}</span>:<span class="digit-box">${String(s).padStart(2,"0")}</span></div>
          </div>
        </div>`;
      })()}

      ${sellers[p.id] ? `<div class="seller-card">
        <div class="seller-header">
          <strong>${escapeHtml(sellers[p.id].name)}</strong>
          <span class="seller-badge">${sellers[p.id].rating}★ (${sellers[p.id].totalSales} terjual)</span>
        </div>
        <div class="seller-meta">
          <span>Bergabung ${sellers[p.id].joinedYear}</span> · <span>Respon ${sellers[p.id].responseTime}</span>
        </div>
      </div>` : ""}

      <p class="modal-deskripsi">${escapeHtml(p.deskripsi || "")}</p>

      ${p.variants && p.variants.length ? `<div class="variants-group">
        <label>Pilih variasi</label>
        <div class="variant-chips">
          ${p.variants.map((v, i) => `<button type="button" class="variant-chip ${i===0?"aktif":""}" data-variant="${i}" data-price="${v.price}" data-stock="${v.stock}">${escapeHtml(v.name)}<br><strong>${rupiah(v.price)}</strong><small>${v.stock} stok</small></button>`).join("")}
        </div>
      </div>` : ""}

      ${p.stockHistory && p.stockHistory.length > 1 ? `<div class="stock-trend">
        <span class="muted">Trend stok 2 minggu terakhir</span>
        <div class="mini-chart">
          ${p.stockHistory.map((h, i) => {
            const pct = (h.stock / Math.max(...p.stockHistory.map((x) => x.stock))) * 100;
            return `<div class="chart-bar" style="height:${pct}%" title="${h.date}: ${h.stock} unit"></div>`;
          }).join("")}
        </div>
      </div>` : ""}

      <div class="modal-delivery">
        <label for="delivery-city">Estimasi pengiriman</label>
        <div class="delivery-row">
          <select id="delivery-city">${(typeof deliveryZones!=="undefined"?deliveryZones:[]).map((z)=>`<option value="${escapeHtml(z.city)}" data-cost="${z.cost}" data-days="${escapeHtml(z.days)}">${escapeHtml(z.city)}</option>`).join("")}</select>
          <span id="delivery-info" class="muted"></span>
        </div>
      </div>

      <div class="modal-qty-row">
        <label for="modal-qty">Jumlah</label>
        <div class="qty-control">
          <button type="button" data-qty="-1" aria-label="Kurangi">−</button>
          <input id="modal-qty" type="number" min="1" max="${Math.max(1, p.stok)}" value="1" />
          <button type="button" data-qty="1" aria-label="Tambah">+</button>
        </div>
      </div>

      <div class="installment-section">
        <label>Cicilan</label>
        <select id="installment-select">
          <option value="0">Pilih cicilan</option>
          ${installmentPlans.filter(plan => p.harga >= plan.minAmount).map(plan => {
            const monthly = Math.round(p.harga / plan.months * (1 + plan.monthlyRate * plan.months));
            return `<option value="${plan.months}">${plan.months} bulan × ${rupiah(monthly)}/bln</option>`;
          }).join("")}
        </select>
        <p id="installment-info" class="muted"></p>
      </div>

      <div class="shipping-section">
        <label>Opsi Pengiriman</label>
        <select id="shipping-select">
          <option value="economy">Ekonomi (${rupiah(shippingCosts.Jakarta.economy)})</option>
          <option value="regular">Reguler (${rupiah(shippingCosts.Jakarta.regular)})</option>
          <option value="express">Express (${rupiah(shippingCosts.Jakarta.express)})</option>
          <option value="sameDay">Same Day (${rupiah(shippingCosts.Jakarta.sameDay || 150000)})</option>
        </select>
      </div>
        </div>
      </div>

      <div class="modal-buttons">
        <button type="button" class="btn-primary" data-modal-action="cart" ${p.stok <= 0 ? "disabled" : ""}>Tambah ke keranjang</button>
        <button type="button" class="btn-secondary" data-modal-action="wa" ${p.stok <= 0 ? "disabled" : ""}>Pesan via WhatsApp</button>
        <button type="button" class="btn-secondary ${wishlisted ? "wish-aktif" : ""}" data-modal-action="wishlist">${wishlisted ? "♥ Tersimpan" : "♡ Wishlist"}</button>
        ${p.stok <= 0 ? `<button type="button" class="btn-secondary" data-modal-action="stock-alert">🔔 Kabari stok</button>` : ""}
      </div>

      ${priceHistory[p.id] && priceHistory[p.id].length > 1 ? `<div class="price-history">
        <h4>Riwayat harga 3 bulan terakhir</h4>
        <div class="price-chart">
          ${priceHistory[p.id].map((h, i) => {
            const max = Math.max(...priceHistory[p.id].map((x) => x.price));
            const min = Math.min(...priceHistory[p.id].map((x) => x.price));
            const range = max - min || 1;
            const pct = ((h.price - min) / range) * 100;
            return `<div class="price-point" style="height:${pct}%" title="${h.date}: ${rupiah(h.price)}"><span class="price-label">${rupiah(h.price)}</span></div>`;
          }).join("")}
        </div>
        <div class="price-dates">${priceHistory[p.id].map((h) => `<span>${h.date.slice(5)}</span>`).join("")}</div>
      </div>` : ""}

      <details class="installment-calc">
        <summary>💳 Simulasi cicilan</summary>
        <div class="installment-options">
          ${[3, 6, 12].map((tenor) => {
            const monthly = Math.ceil(p.harga / tenor);
            return `<div class="installment-row"><strong>${tenor}x cicilan</strong><span>${rupiah(monthly)}/bulan</span></div>`;
          }).join("")}
          <p class="muted">*Estimasi, belum termasuk bunga bank</p>
        </div>
      </details>
      </div>
    </div>
  </div>

  <div class="modal-sections modal-sections-wide">
    <section class="modal-panel">
      <h3>Spesifikasi</h3>
      ${specs.length
        ? `<dl class="spec-list">${specs.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}</dl>`
        : `<p class="muted">Spesifikasi belum tersedia.</p>`}
    </section>
    <section class="modal-panel">
      <h3>Ulasan pembeli <span class="count-badge">${reviews.length}</span></h3>
      <div class="rating-summary">
        <div class="rating-big"><strong>${Number(p.rating).toFixed(1)}</strong><div>${bintang(p.rating)}</div><span class="muted">${p.reviewCount} ulasan</span></div>
        <div class="rating-bars">
          ${ratingDist.map((d)=>`<div class="rating-bar-row"><span>${d.star}★</span><div class="bar-track"><div class="bar-fill" style="width:${(d.count/maxCount)*100}%"></div></div><span>${d.count}</span></div>`).join("")}
        </div>
      </div>
      ${reviews.length
        ? `<ul class="review-list">${reviews.map((r, idx) => `<li>
            <div class="review-head">${bintang(r.rating)} <strong>${escapeHtml(r.nama || "Pembeli")}</strong> <time>${escapeHtml(r.tanggal || "")}</time></div>
            <p>${escapeHtml(r.komentar || "")}</p>
            ${r.photos && r.photos.length ? `<div class="review-photos">${r.photos.map((ph)=>`<img src="${escapeHtml(ph)}" alt="Foto ulasan" class="review-photo" loading="lazy" />`).join("")}</div>` : ""}
            <button type="button" class="helpful-btn" data-helpful="${idx}">👍 Membantu (${r.helpful || 0})</button>
          </li>`).join("")}</ul>`
        : `<p class="muted">Belum ada ulasan.</p>`}
      <form class="review-form" id="review-form">
        <h4>Tulis ulasan</h4>
        <div class="review-form-row">
          <label for="review-rating">Rating</label>
          <select id="review-rating">${[5,4,3,2,1].map((s)=>`<option value="${s}"${s===5?" selected":""}>${"★".repeat(s)} ${s}</option>`).join("")}</select>
        </div>
        <textarea id="review-komentar" rows="3" maxlength="500" required placeholder="Ceritakan pengalaman Anda memakai produk ini"></textarea>
        <input id="review-foto" type="url" placeholder="URL foto ulasan (opsional)" />
        <button type="submit" class="btn-primary">Kirim ulasan</button>
      </form>
    </section>
  </div>

  ${qa.length ? `<section class="modal-qa">
    <h3>Tanya Jawab <span class="count-badge">${qa.length}</span></h3>
    <ul class="qa-list">
      ${qa.map((item) => `<li class="qa-item">
        <div class="qa-q"><strong>T:</strong> ${escapeHtml(item.q)}<span class="muted"> — ${escapeHtml(item.askedBy)}</span></div>
        <div class="qa-a"><strong>J:</strong> ${escapeHtml(item.a)}<span class="muted"> ${escapeHtml(item.answeredAt)}</span></div>
      </li>`).join("")}
    </ul>
    <button type="button" class="btn-small" id="btn-ask-question">Ajukan pertanyaan</button>
  </section>` : ""}

  ${related.length ? `<section class="modal-related">
    <h3>Produk terkait & rekomendasi</h3>
    <div class="related-grid related-grid-4">
      ${related.map((r) => `<button type="button" class="related-card" data-related="${escapeHtml(r.id)}">
        ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.nama)}" loading="lazy" />` : `<span class="ph">Foto</span>`}
        <strong>${escapeHtml(r.nama)}</strong>
        <span>${rupiah(r.harga)}</span>
        <small class="muted">${bintang(r.rating)} ${Number(r.rating).toFixed(1)}</small>
      </button>`).join("")}
    </div>
  </section>` : ""}
</div>`;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.focus();
  closeBtn.addEventListener("click", closeProductModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeProductModal();
  });

  // Gallery thumbs
  const mainImg = modal.querySelector("#modal-main-img");
  modal.querySelectorAll("[data-gallery-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (mainImg) mainImg.src = btn.dataset.gallerySrc;
      modal.querySelectorAll(".thumb").forEach((t) => t.classList.toggle("aktif", t === btn));
    });
  });
  // Delivery estimate
  const dSel = modal.querySelector("#delivery-city");
  const dInfo = modal.querySelector("#delivery-info");
  function paintDelivery() {
    if (!dSel || !dInfo) return;
    const opt = dSel.selectedOptions[0];
    dInfo.textContent = `Ongkir ${rupiah(opt?.dataset.cost || 0)} · Estimasi ${opt?.dataset.days || "-"} hari`;
  }
  dSel?.addEventListener("change", paintDelivery);
  paintDelivery();

  // Installment select
  const instSel = modal.querySelector("#installment-select");
  const instInfo = modal.querySelector("#installment-info");
  instSel?.addEventListener("change", () => {
    if (!instSel.value) { instInfo.textContent = ""; return; }
    const months = Number(instSel.value);
    const monthly = Math.round(p.harga / months * (1 + 0.02 * months));
    instInfo.textContent = `${rupiah(monthly)}/bulan × ${months} bulan (cicilan tanpa kartu kredit)`;
  });

  // Shipping select
  const shipSel = modal.querySelector("#shipping-select");
  shipSel?.addEventListener("change", () => {
    const city = dSel?.selectedOptions[0]?.value || "Jakarta";
    const method = shipSel.value;
    const cost = calcShipping(city, method);
    console.log(`Shipping: ${method} → ${rupiah(cost)}`);
  });

  // Flash sale countdown
  const updateFlashTimers = () => {
    modal.querySelectorAll("[data-ends]").forEach((timer) => {
      const ends = new Date(timer.dataset.ends);
      const now = new Date();
      if (now >= ends) {
        timer.innerHTML = "<span class=\"muted\">Flash sale berakhir</span>";
        return;
      }
      const diff = Math.floor((ends - now) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      const digits = timer.querySelectorAll(".digit-box");
      if (digits[0]) digits[0].textContent = String(h).padStart(2, "0");
      if (digits[1]) digits[1].textContent = String(m).padStart(2, "0");
      if (digits[2]) digits[2].textContent = String(s).padStart(2, "0");
    });
  };
  updateFlashTimers();
  const fleshInterval = setInterval(updateFlashTimers, 1000);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) { closeProductModal(); clearInterval(fleshInterval); }
  });
  modal.querySelectorAll(".variant-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.querySelectorAll(".variant-chip").forEach((b) => b.classList.remove("aktif"));
      btn.classList.add("aktif");
      const variantIdx = Number(btn.dataset.variant);
      modal.dataset.selectedVariant = variantIdx;
      const newPrice = Number(btn.dataset.price);
      const newStock = Number(btn.dataset.stock);
      modal.querySelector(".modal-harga").innerHTML = `${rupiah(newPrice)} ${diskon}`;
      const stokP = modal.querySelector(".stok");
      stokP.textContent = newStock > 0 ? `Stok tersedia: ${newStock}` : "Stok habis";
      stokP.className = newStock > 0 ? "stok stok-ada" : "stok stok-habis";
      qtyInput.max = Math.max(1, newStock);
      qtyInput.value = Math.min(Number(qtyInput.value), newStock);
    });
  });

  // Helpful votes
  modal.querySelectorAll("[data-helpful]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.helpful);
      const base = (reviews[i]?.helpful || 0) + 1;
      btn.textContent = `👍 Membantu (${base})`;
      btn.disabled = true;
    });
  });

  const qtyInput = modal.querySelector("#modal-qty");
  modal.addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) {
      const step = Number(qtyBtn.dataset.qty);
      const max = Math.max(1, p.stok);
      qtyInput.value = Math.min(max, Math.max(1, Number(qtyInput.value) + step));
      return;
    }
    const action = e.target.closest("[data-modal-action]");
    if (!action || action.disabled) return;
    const kind = action.dataset.modalAction;
    const qty = Math.max(1, Number(qtyInput.value));
    if (kind === "cart") {
      const variantIdx = modal.dataset.selectedVariant ? Number(modal.dataset.selectedVariant) : undefined;
      const cartItem = { id: p.id, qty, ...(variantIdx !== undefined && { variantIdx }) };
      const cart = loadCart();
      const idx = cart.findIndex((i) => i.id === p.id && (i.variantIdx ?? -1) === (variantIdx ?? -1));
      let next;
      if (idx >= 0) next = cart.map((i, k) => (k === idx ? { ...i, qty: i.qty + qty } : i));
      else next = [...cart, cartItem];
      saveCart(next);
      toast(`${p.nama} × ${qty} masuk keranjang.`, "ok");
      renderBadges();
    } else if (kind === "wa") {
      try {
        window.open(buildWhatsAppUrl(WA_PHONE, {
          nama: p.nama,
          harga: p.harga * qty,
          deskripsi: (p.deskripsi || "") + `\nJumlah: ${qty}`,
        }), "_blank", "noopener");
      } catch (err) {
        toast("Gagal membuka WhatsApp: " + err.message, "error");
      }
    } else if (kind === "stock-alert") {
          const email = prompt("Masukkan email untuk notifikasi stok:");
          if (email && email.includes("@")) {
            addStockAlert(p.id, email);
            toast(`Notifikasi stok untuk ${p.nama} akan dikirim ke ${email}`, "ok");
          } else if (email) {
            toast("Email tidak valid", "error");
          }
      action.textContent = "🔔 Aktif";
      action.disabled = true;
    } else if (kind === "wishlist") {
      const next = toggleWishlist(loadWishlist(), p.id);
      const aktif = next.includes(p.id);
      action.textContent = aktif ? "♥ Tersimpan" : "♡ Wishlist";
      action.classList.toggle("wish-aktif", aktif);
      toast(aktif ? "Disimpan ke wishlist." : "Dihapus dari wishlist.", "ok");
      renderBadges();
    }
  });

  const reviewForm = modal.querySelector("#review-form");
  reviewForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const rating = Number(modal.querySelector("#review-rating").value);
    const komentar = modal.querySelector("#review-komentar").value.trim();
    const foto = modal.querySelector("#review-foto").value.trim();
    if (!komentar) { toast("Komentar wajib diisi.", "error"); return; }
    const sess = getSession();
    addReview(p.id, {
      nama: sess?.nama || "Pembeli",
      rating,
      komentar,
      photos: foto ? [foto] : [],
    });
    toast("Ulasan ditambahkan.", "ok");
    const fresh = loadProducts().find((x) => x.id === p.id) || p;
    openProductModal(fresh);
  });
  modal.querySelectorAll(".review-photo").forEach((img) => {
    img.addEventListener("click", () => bukaFoto(img.src));
  });

  modal.querySelector("#btn-ask-question")?.addEventListener("click", () => {
    const q = prompt("Tulis pertanyaan Anda:");
    if (!q || !q.trim()) return;
    toast("Pertanyaan dikirim. Admin akan menjawab segera.", "ok");
  });

  modal.querySelectorAll("[data-related]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const relatedProduct = allProducts.find((x) => x.id === btn.dataset.related);
      if (relatedProduct) {
        addRecent(loadRecent(), relatedProduct.id);
        renderRecentSection();
        openProductModal(relatedProduct);
      }
    });
  });

  // Image zoom on click
  const zoomImg = modal.querySelector("#modal-main-img");
  if (zoomImg) {
    zoomImg.addEventListener("click", () => {
      const zoomDialog = document.createElement("dialog");
      zoomDialog.className = "zoom-modal";
      zoomDialog.innerHTML = `<img src="${zoomImg.src}" alt="Zoom" /><button type="button" class="modal-close" aria-label="Tutup">×</button>`;
      zoomDialog.addEventListener("click", (e) => { if (e.target === zoomDialog) zoomDialog.close(); });
      zoomDialog.querySelector(".modal-close").addEventListener("click", () => zoomDialog.close());
      document.body.appendChild(zoomDialog);
      zoomDialog.showModal();
    });
  }
}

export function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  modal.innerHTML = "";
  document.body.classList.remove("modal-open");
}

// ---------------------------------------------------------------------------
// Keranjang & Wishlist
// ---------------------------------------------------------------------------
function openCheckout(list, subtotal, shipping) {
  let dlg = document.getElementById("checkout-dialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "checkout-dialog";
    dlg.className = "checkout-dialog";
    document.body.appendChild(dlg);
  }
  const metode = paymentMethods.find((m) => m.id === "qris");
  const fee = metode.fee || 0;
  const total = subtotal + shipping + fee;

  dlg.innerHTML = `
<div class="checkout-box">
  <div class="checkout-head">
    <div><span class="eyebrow">Checkout</span><h2>Bayar dengan QRIS</h2></div>
    <button type="button" class="btn-close" id="co-close">✕</button>
  </div>
  <div class="checkout-steps">
    <div class="checkout-step active" data-step="1">1. Alamat</div>
    <div class="checkout-step" data-step="2">2. Pengiriman</div>
    <div class="checkout-step" data-step="3">3. Pembayaran</div>
    <div class="checkout-step" data-step="4">4. Konfirmasi</div>
  </div>
  <div class="checkout-content" id="co-content"></div>
</div>`;

  const content = dlg.querySelector("#co-content");
  const stepEls = dlg.querySelectorAll(".checkout-step");
  const state = { address: userAddresses.find((a) => a.isDefault) || userAddresses[0], courier: "JNE", payment: "qris" };

  function setStep(n) {
    stepEls.forEach((el) => el.classList.toggle("active", Number(el.dataset.step) === n));
    const step = n;
    if (step === 1) {
      content.innerHTML = `<h3>Pilih Alamat Pengiriman</h3>
        <div class="co-addresses">
          ${userAddresses.map((a) => `<label class="co-address ${state.address.id === a.id ? "selected" : ""}">
            <input type="radio" name="co-addr" value="${a.id}" ${state.address.id === a.id ? "checked" : ""} />
            <strong>${escapeHtml(a.label)} ${a.isDefault ? "(Utama)" : ""}</strong>
            <span>${escapeHtml(a.name)} · ${escapeHtml(a.phone)}</span>
            <span class="muted">${escapeHtml(a.address)}, ${escapeHtml(a.city)}</span>
          </label>`).join("")}
        </div>
        <button type="button" class="btn-primary co-next">Lanjut ke Pengiriman</button>`;
      content.querySelectorAll("input[name=co-addr]").forEach((r) => {
        r.addEventListener("change", () => {
          state.address = userAddresses.find((a) => a.id === Number(r.value));
          content.querySelectorAll(".co-address").forEach((el) => el.classList.toggle("selected", el.querySelector("input").checked));
        });
      });
    } else if (step === 2) {
      const zones = deliveryZones.filter((z) => z.city.toLowerCase() === (state.address.city || "").toLowerCase());
      const zone = zones[0] || deliveryZones[0];
      const couriers = ["JNE", "J&T", "SiCepat", "Pos Indonesia"];
      content.innerHTML = `<h3>Pilih Kurir</h3>
        <p class="muted">Kirim ke ${escapeHtml(state.address.city)} · estimasi ${zone.days} hari</p>
        <div class="co-couriers">
          ${couriers.map((c) => `<label class="co-courier ${state.courier === c ? "selected" : ""}">
            <input type="radio" name="co-courier" value="${c}" ${state.courier === c ? "checked" : ""} />
            <strong>${c}</strong><span>${rupiah(zone.cost)}</span>
          </label>`).join("")}
        </div>
        <button type="button" class="btn-primary co-next">Lanjut ke Pembayaran</button>`;
      content.querySelectorAll("input[name=co-courier]").forEach((r) => {
        r.addEventListener("change", () => {
          state.courier = r.value;
          content.querySelectorAll(".co-courier").forEach((el) => el.classList.toggle("selected", el.querySelector("input").checked));
        });
      });
    } else if (step === 3) {
      content.innerHTML = `<h3>Metode Pembayaran</h3>
        <div class="co-payments">
          ${paymentMethods.map((m) => `<label class="co-payment ${state.payment === m.id ? "selected" : ""}">
            <input type="radio" name="co-pay" value="${m.id}" ${state.payment === m.id ? "checked" : ""} />
            <span class="co-pay-logo">${m.logo}</span>
            <span><strong>${escapeHtml(m.name)}</strong>${m.fee ? `<small class="muted">+ ${rupiah(m.fee)}</small>` : ""}</span>
          </label>`).join("")}
        </div>
        <button type="button" class="btn-primary co-next">Lanjut ke Konfirmasi</button>`;
      content.querySelectorAll("input[name=co-pay]").forEach((r) => {
        r.addEventListener("change", () => {
          state.payment = r.value;
          content.querySelectorAll(".co-payment").forEach((el) => el.classList.toggle("selected", el.querySelector("input").checked));
        });
      });
    } else if (step === 4) {
      const pay = paymentMethods.find((m) => m.id === state.payment);
      content.innerHTML = `<h3>Konfirmasi Pesanan</h3>
        <div class="co-review">
          <div><span>Alamat</span><strong>${escapeHtml(state.address.label)} · ${escapeHtml(state.address.city)}</strong></div>
          <div><span>Kurir</span><strong>${state.courier} · ${rupiah(shipping)}</strong></div>
          <div><span>Pembayaran</span><strong>${pay.logo} ${escapeHtml(pay.name)}</strong></div>
          <div><span>Subtotal</span><strong>${rupiah(subtotal)}</strong></div>
          <div><span>Total</span><strong class="co-total">${rupiah(total)}</strong></div>
        </div>
        <div class="co-actions">
          <button type="button" class="btn-secondary co-back">Kembali</button>
          <button type="button" class="btn-primary co-pay">Bayar Sekarang</button>
        </div>`;
      content.querySelector(".co-back").addEventListener("click", () => setStep(3));
      content.querySelector(".co-pay").addEventListener("click", () => {
        const order = {
          total,
          items: list.map((i) => ({ id: i.id, qty: i.qty, variantIdx: i.variantIdx })),
          address: state.address,
          courier: state.courier,
          payment: state.payment,
          paymentName: pay.name,
        };
        addOrder(order);
        renderCart(clearCart());
        renderBadges();
        dlg.close();
        showQRIS(total, order);
      });
    }
    const next = content.querySelector(".co-next");
    if (next) next.addEventListener("click", () => setStep(step + 1));
  }

  function showQRIS(amount, order) {
    let qdlg = document.getElementById("qris-dialog");
    if (!qdlg) {
      qdlg = document.createElement("dialog");
      qdlg.id = "qris-dialog";
      qdlg.className = "qris-dialog";
      document.body.appendChild(qdlg);
    }
    qdlg.innerHTML = `
<div class="qris-box">
  <h2>QRIS belum dikonfigurasi</h2>
  <div class="qris-code qris-pending" aria-label="QRIS belum tersedia">QRIS</div>
  <p class="qris-amount">${rupiah(amount)}</p>
  <p>Pesanan dibuat, tetapi belum dibayar. Toko perlu menghubungkan penyedia pembayaran QRIS agar dapat membuat kode valid dan memverifikasi transaksi.</p>
  <p class="muted qris-order">Order ID: ${escapeHtml(order.id || "ORD-" + Date.now())} · Menunggu pembayaran</p>
  <button type="button" class="btn-primary qris-close">Tutup</button>
</div>`;
    qdlg.showModal();
    qdlg.querySelector(".qris-close").addEventListener("click", () => qdlg.close());
  }

  dlg.querySelector("#co-close").addEventListener("click", () => dlg.close());
  setStep(1);
  dlg.showModal();
}

function renderCart(list) {
  const panel = document.getElementById("view-cart");
  if (!panel) return;

  const subtotal = list.reduce((sum, item) => {
    const p = allProducts.find((x) => x.id === item.id);
    if (!p) return sum;
    let price = p.harga;
    if (item.variantIdx !== undefined && p.variants && p.variants[item.variantIdx]) {
      price = p.variants[item.variantIdx].price;
    }
    return sum + price * item.qty;
  }, 0);
  const shipping = 15000; // default
  const total = subtotal;

  const baris = list.map((item) => {
    const p = allProducts.find((x) => x.id === item.id);
    let price = p ? p.harga : 0;
    let variantName = "";
    if (p && item.variantIdx !== undefined && p.variants && p.variants[item.variantIdx]) {
      price = p.variants[item.variantIdx].price;
      variantName = ` (${p.variants[item.variantIdx].name})`;
    }
    return `<tr>
      <td>${escapeHtml(p ? p.nama + variantName : item.id)}</td>
      <td>${p ? rupiah(price) : "—"}</td>
      <td><input type="number" min="1" value="${item.qty}" data-id="${escapeHtml(item.id)}" ${item.variantIdx !== undefined ? `data-variant="${item.variantIdx}"` : ""} class="qty-input" aria-label="Jumlah ${escapeHtml(p ? p.nama : item.id)}" /></td>
      <td>${p ? rupiah(price * item.qty) : "—"}</td>
      <td><button type="button" class="btn-small danger hapus-dari-cart" data-id="${escapeHtml(item.id)}" ${item.variantIdx !== undefined ? `data-variant="${item.variantIdx}"` : ""}>Hapus</button></td>
    </tr>`;
  }).join("");

  panel.innerHTML = `
<div class="cart-panel panel">
  <div class="section-head"><div><span class="eyebrow">Belanja</span><h2>Keranjang Saya</h2></div><span class="count-badge">${cartCount(list)} item</span></div>
  ${list.length === 0
    ? `<div class="empty-state"><p>Keranjang masih kosong.</p><button type="button" class="btn-primary" data-goto-katalog>Lihat katalog</button></div>`
    : `<div class="table-wrap"><table class="cart-table">
        <thead><tr><th>Produk</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th><th>Aksi</th></tr></thead>
        <tbody>${baris}</tbody>
      </table></div>`}
  <div class="cart-summary" id="cart-summary">
    <div class="promo-row">
      <input type="text" id="promo-input" placeholder="Masukkan kode promo" maxlength="40" autocomplete="off" />
      <button type="button" class="btn-small" id="promo-apply">Terapkan</button>
    </div>
    <p class="promo-result" id="promo-result"></p>
    ${userLoyalty ? `<div class="loyalty-section">
      <div class="loyalty-header"><strong>⭐ Program Loyalitas</strong> <span class="tier-badge">${userLoyalty.tier}</span></div>
      <div class="loyalty-info">
        <div><span>Poin saat ini</span><strong>${userLoyalty.points.toLocaleString('id-ID')}</strong></div>
        <div><span>Poin dari pembelian ini</span><strong class="gain">+${Math.floor(subtotal * loyaltyProgram.pointsPerRupiah)}</strong></div>
        <div><span>Target tier berikutnya</span><span class="muted">${userLoyalty.nextTierPoints - userLoyalty.points} poin lagi</span></div>
      </div>
    </div>` : ""}
    <div class="cart-breakdown">
      <div><span>Subtotal</span><span>${rupiah(subtotal)}</span></div>
      <div><span>Diskon</span><span id="promo-discount">- ${rupiah(0)}</span></div>
      <div><span>Ongkir</span><span id="shipping-cost">${rupiah(shipping)}</span></div>
      <div><strong>Total</strong><strong id="grand-total">${rupiah(total + shipping)}</strong></div>
    </div>
  </div>
  <div class="cart-actions">
    <button type="button" class="btn-primary" id="bayar-qris" ${list.length === 0 ? "disabled" : ""}>Checkout QRIS</button>
    <button type="button" class="btn-secondary" id="bayar-wa" ${list.length === 0 ? "disabled" : ""}>Bayar via WhatsApp</button>
    <button type="button" class="btn-secondary" id="kosongkan-cart" ${list.length === 0 ? "disabled" : ""}>Kosongkan</button>
  </div>
</div>`;

  panel.querySelector("[data-goto-katalog]")?.addEventListener("click", () => showView("catalog"));

  panel.querySelectorAll(".qty-input").forEach((inp) => {
    inp.addEventListener("change", () => {
      const qty = Math.max(1, Number(inp.value) || 1);
      const next = updateCartQty(list, inp.dataset.id, qty);
      renderCart(next);
      renderBadges();
    });
  });
  panel.querySelectorAll(".hapus-dari-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = removeFromCart(list, btn.dataset.id);
      renderCart(next);
      renderBadges();
      toast("Item dihapus dari keranjang.", "ok");
    });
  });
  panel.querySelector("#kosongkan-cart")?.addEventListener("click", () => {
    renderCart(clearCart());
    renderBadges();
    toast("Keranjang dikosongkan.", "ok");
  });
  panel.querySelector("#bayar-wa")?.addEventListener("click", () => {
    const rincian = list.map((i) => {
      const p = allProducts.find((x) => x.id === i.id);
      return p ? `${p.nama} x${i.qty} = ${rupiah(p.harga * i.qty)}` : "";
    }).filter(Boolean).join("\n");
    try {
      window.open(buildWhatsAppUrl(WA_PHONE, {
        nama: "Pesanan Tokokomputer",
        harga: total,
        deskripsi: rincian + `\nTotal: ${rupiah(total)}`,
      }), "_blank", "noopener");
    } catch (err) {
      toast("Gagal membuka WhatsApp: " + err.message, "error");
    }
    addOrder({ total, items: list.map((i) => ({ id: i.id, qty: i.qty })) });
    toast("Pesanan disimpan di menu Pesanan.", "ok");
    renderCart(clearCart());
    renderBadges();
  });
  panel.querySelector("#bayar-qris")?.addEventListener("click", () => {
    openCheckout(list, subtotal, shipping);
  });
  panel.querySelector("#promo-apply")?.addEventListener("click", () => {
    const code = panel.querySelector("#promo-input").value.trim().toUpperCase();
    if (!code) {
      toast("Masukkan kode promo", "error");
      return;
    }
    const found = promoCodes.find(c => c.code.toUpperCase() === code);
    if (!found) {
      toast("Kode promo tidak valid", "error");
      return;
    }
    if (total < found.minPurchase) {
      toast(`Belanja minimum ${rupiah(found.minPurchase)}`, "error");
      return;
    }
    const disc = found.type === "percent" ? Math.min(total * found.discount / 100, found.maxDiscount) : Math.min(found.discount, found.maxDiscount);
    const newTotal = Math.max(0, total - disc);
    document.getElementById("promo-result").textContent = `✓ Diskon ${found.type === "percent" ? found.discount + "%" : rupiah(disc)}`;
    document.getElementById("promo-discount").textContent = `- ${rupiah(disc)}`;
    document.getElementById("grand-total").textContent = rupiah(newTotal + shipping);
    toast(`Kode ${found.code} diterapkan!`, "ok");
  });
}

function renderHelp() {
  const panel = document.getElementById("view-help");
  if (!panel) return;
  panel.innerHTML = `<div class="info-page">
    <div class="section-head"><div><span class="eyebrow">Pusat Bantuan</span><h2>Butuh bantuan?</h2></div></div>
    <p class="lead">Kami bantu pilih produk, cek stok, dan proses pesanan.</p>
    <div class="help-grid">
      <article class="help-card"><h4>Bagaimana cara pesan?</h4><p>Pilih produk → keranjang → Bayar via WhatsApp.</p></article>
      <article class="help-card"><h4>Apakah stok real-time?</h4><p>Ya. Stok diperbarui dari katalog, produk habis tidak bisa dipesan.</p></article>
      <article class="help-card"><h4>Butuh rekomendasi?</h4><p>Bandingkan maksimal 3 produk sebelum membeli.</p></article>
    </div>
    <a class="btn-primary" href="https://wa.me/6281234567890" target="_blank" rel="noopener">Chat admin</a>
  </div>`;
}

function renderWishlist(list) {
  const panel = document.getElementById("view-wishlist");
  if (!panel) return;

  const items = list.map((id) => allProducts.find((x) => x.id === id)).filter(Boolean);
  panel.innerHTML = `
<div class="wishlist-panel panel">
  <div class="section-head"><div><span class="eyebrow">Favorit</span><h2>Wishlist Saya</h2></div><span class="count-badge">${items.length} item</span></div>
  ${items.length ? `<div class="share-wishlist"><button type="button" class="btn-small" id="share-wishlist">Bagikan wishlist</button></div>` : ""}
  ${items.length === 0
    ? `<div class="empty-state"><p>Wishlist masih kosong.</p><button type="button" class="btn-primary" data-goto-katalog>Lihat katalog</button></div>`
    : `<div class="grid wishlist-grid">${items.map((p) => `<article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button">
        <div class="card-media">${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" />` : `<div class="ph">Foto produk</div>`}</div>
        <div class="card-body">
          <p class="cat">${escapeHtml(p.kategori)}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price">${rupiah(p.harga)}</p>
          <div class="card-actions">
            <button type="button" class="btn-small add-to-cart" data-id="${escapeHtml(p.id)}" ${p.stok <= 0 ? "disabled" : ""}>Tambah ke keranjang</button>
            <button type="button" class="btn-small danger hapus-wishlist" data-id="${escapeHtml(p.id)}">Hapus</button>
          </div>
        </div>
      </article>`).join("")}</div>`}
</div>`;

  panel.querySelector("[data-goto-katalog]")?.addEventListener("click", () => showView("catalog"));

  panel.addEventListener("click", (e) => {
    const add = e.target.closest(".add-to-cart");
    if (add) {
      const id = add.dataset.id;
      const p = allProducts.find((x) => x.id === id);
      if (p && p.stok > 0) {
        addToCart(loadCart(), id);
        toast(`${p.nama} masuk keranjang.`, "ok");
        renderBadges();
      }
      return;
    }
    const hapus = e.target.closest(".hapus-wishlist");
    if (hapus) {
      const next = toggleWishlist(loadWishlist(), hapus.dataset.id);
      renderWishlist(next);
      renderBadges();
      toast("Dihapus dari wishlist.", "ok");
      return;
    }
    const card = e.target.closest("article[data-id]");
    if (card) {
      const p = allProducts.find((x) => x.id === card.dataset.id);
      if (p) { addRecent(loadRecent(), p.id); renderRecentSection(); openProductModal(p); }
    }
  });
  panel.querySelector("#share-wishlist")?.addEventListener("click", async () => {
    const ids = items.map((p) => p.id).join(",");
    const url = `${location.origin}${location.pathname}#wishlist=${ids}`;
    try {
      if (navigator.share) await navigator.share({ title: "Wishlist Saya", text: "Cek wishlist saya di TokoKomputer", url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Tautan wishlist disalin.", "ok");
      }
    } catch (err) {
      if (err && err.name !== "AbortError") toast("Gagal bagikan wishlist.", "error");
    }
  });
}


function renderOrders() {
  const panel = document.getElementById("view-orders");
  if (!panel) return;
  const session = getSession();
  if (!session) {
    panel.innerHTML = `<div class="info-page"><h2>Masuk untuk melihat pesanan</h2><p class="muted">Silakan login terlebih dahulu.</p></div>`;
    return;
  }
  const orders = orderHistory;
  panel.innerHTML = orders.length ? `
    <div class="orders-list">
      ${orders.map((o) => {
        const itemsHtml = o.items.map((i) => {
          const p = allProducts.find((x) => x.id === i.productId);
          return `<span>${escapeHtml(p ? p.nama : "Produk")} × ${i.qty}</span>`;
        }).join(" · ");
        const trackingHtml = o.tracking?.map((t) => `<li>${escapeHtml(t.date)} — <strong>${escapeHtml(t.status)}</strong> <span class="muted">(${escapeHtml(t.location)})</span></li>`).join("");
        return `<article class="order-item">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:.4rem;">
            <strong>Pesanan #${escapeHtml(String(o.id))}</strong>
            <time class="muted">${new Date(o.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</time>
          </div>
          <p>${itemsHtml}</p>
          <p style="font-weight:700;color:var(--accent-primary);">Total: ${rupiah(o.total)}</p>
          <div class="tracking-timeline" role="list">${trackingHtml}</div>
        </article>`;
      }).join("")}
    </div>` : `<p class="muted">Belum ada riwayat pesanan.</p>`;
}

function renderVouchers() {
  const panel = document.getElementById("view-vouchers");
  if (!panel) return;
  const session = getSession();
  if (!session) {
    panel.innerHTML = `<div class="info-page"><h2>Masuk untuk melihat voucher</h2><p class="muted">Silakan login terlebih dahulu.</p></div>`;
    return;
  }
  const claims = loadVoucherClaims();
  panel.innerHTML = `
    <section class="info-page">
      <h2>Kode Promo</h2>
      <p class="lead">Masukkan kode promo di keranjang untuk dapat diskon.</p>
      <div class="promo-list" style="display:grid;gap:.6rem;margin:1rem 0;">
        ${promoCodes.map((c) => `<article style="border:1px solid var(--border-default);border-radius:10px;padding:.85rem;display:grid;grid-template-columns:1fr auto;gap:.7rem;align-items:center;">
          <div>
            <code style="font-size:1rem;font-weight:800;color:var(--accent-primary);">${escapeHtml(c.code)}</code>
            <span class="muted" style="margin-left:.6rem;">${c.type === "percent" ? c.discount + "%" : "Rp " + c.discount.toLocaleString("id-ID")}</span>
            <p class="muted" style="margin:.35rem 0 0;font-size:.8rem;">Min. belanja ${rupiah(c.minPurchase)} · Maks diskon ${rupiah(c.maxDiscount)} · Berlaku s/d ${new Date(c.expires).toLocaleDateString("id-ID")}</p>
          </div>
          <button type="button" class="btn-small" data-copy="${escapeHtml(c.code)}">Salin</button>
        </article>`).join("")}
      </div>
      <hr style="margin:1.5rem 0;border-color:var(--border-default);">
      <h3>Voucher Diklaim</h3>
      ${claims.length ? claims.map((v) => `<p class="voucher-item" style="border:1px solid var(--border-default);border-radius:8px;padding:.65rem;margin:.4rem 0;display:flex;justify-content:space-between;align-items:center;">${escapeHtml(v.code)} <span class="muted">${escapeHtml(v.status || "aktif")}</span></p>`).join("") : `<p class="muted">Belum ada voucher diklaim.</p>`}
    </section>`;
  panel.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(btn.dataset.copy);
      toast("Kode disalin: " + btn.dataset.copy, "ok");
    });
  });
  panel.querySelector(".voucher-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = panel.querySelector("#voucher-code").value.trim();
      if (code) { claimVoucher(code); toast("Voucher diklaim.", "ok"); renderVouchers(); }
    });
  }

  function renderProfile() {
    const panel = document.getElementById("view-profile");
    if (!panel) return;
    const session = getSession();
    if (!session) {
      panel.innerHTML = `<div class="info-page"><div class="section-head"><div><span class="eyebrow">Profil</span><h2>Masuk untuk melihat profil</h2></div></div><p class="muted">Silakan login terlebih dahulu.</p></div>`;
      return;
    }
    const addresses = userAddresses.filter((a) => a.phone && a.address);
    const orders = loadOrders();
    const wishCount = loadWishlist().length;
    const loyalty = loadLoyalty();
    const pts = loyalty.points || orders.length * 50;
    const tier = loyaltyTier(pts);
    panel.innerHTML = `
  <div class="info-page">
    <div class="section-head"><div><span class="eyebrow">Profil</span><h2>${escapeHtml(session.nama)}</h2></div></div>
    <div class="profile-grid">
      <div class="profile-card">
        <h3>Detail Akun</h3>
        <p><strong>Username:</strong> ${escapeHtml(session.username)}</p>
        <p><strong>Peran:</strong> ${session.role === "admin" ? "Admin" : "Pelanggan"}</p>
        <p><strong>Email:</strong> <a href="mailto:${session.username}@tokokomputer.id">${session.username}@tokokomputer.id</a></p>
      </div>
      <div class="profile-card">
        <h3>Loyalitas & Statistik</h3>
        <p><strong>Tier:</strong> <span class="tier-badge" style="background:${tier.color}22;color:${tier.color};border:1px solid ${tier.color}55">${tier.name}</span></p>
        <p><strong>Poin:</strong> ${pts} poin ${tier.next ? `<small class="muted">(${tier.next - pts} lagi ke tier berikutnya)</small>` : `<small class="muted">(tier tertinggi)</small>`}</p>
        <p><strong>Pesanan:</strong> ${orders.length} tercatat</p>
        <p><strong>Wishlist:</strong> ${wishCount} produk</p>
      </div>
      <div class="profile-card">
        <h3>Alamat Pengiriman</h3>
        ${addresses.length ? addresses.map((a, i) => `<div class="address-item"><strong>Alamat ${i + 1}</strong><p class="muted">${escapeHtml(a.address)}, ${escapeHtml(a.city)}</p><p class="muted">HP: ${escapeHtml(a.phone)}</p></div>`).join("") : `<p class="muted">Tidak ada alamat tersimpan.</p>`}
      </div>
    </div>
  </div>`;
  }
