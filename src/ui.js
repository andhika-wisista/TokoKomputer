import {
  getNotice, KATEGORI_VALID, loadCart, addToCart, updateCartQty,
  removeFromCart, clearCart, loadWishlist, toggleWishlist, cartCount, cartTotal,
  loadRecent, addRecent, loadCompare, toggleCompare, clearCompare,
  loadOrders, addOrder, loadVoucherClaims, claimVoucher
} from "./store.js";
import { WA_PHONE } from "./config.js";
import { escapeHtml } from "./utils/dom.js";
import { buildWhatsAppUrl } from "./utils/whatsapp.js";
import { products as allProducts } from "./products.js";
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
  <section id="view-help" data-view-panel hidden></section>
  <section id="view-lokasi" data-view-panel hidden></section>
  <section id="view-dashboard" data-view-panel hidden></section>
</main>

<footer class="footer">
  <div class="footer-grid">
    <div class="footer-col">
      <span class="eyebrow">TokoKomputer</span>
      <h3 class="logo">TokoKomputer<span class="logo-span">.</span></h3>
      <p class="footer-small">Penyedia solusi hardware &amp; aksesoris komputer terpercaya sejak 2026.</p>
      <p class="footer-small mt-2">WA Sales: <a href="https://wa.me/628****7890" class="wa-link">Chat via WhatsApp</a></p>
    </div>
    <div class="footer-col">
      <h4 class="footer-title">Kategori Utama</h4>
      <ul class="footer-list">
        <li><a href="#" class="footer-link">Laptop</a></li>
        <li><a href="#" class="footer-link">Komponen</a></li>
        <li><a href="#" class="footer-link">Aksesoris</a></li>
        <li><a href="#" class="footer-link">Periferal</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4 class="footer-title">Layanan</h4>
      <ul class="footer-list">
        <li><a href="#" class="footer-link">Garansi Resmi</a></li>
        <li><a href="#" class="footer-link">Instalasi PC</a></li>
        <li><a href="#" class="footer-link">Trade-In</a></li>
        <li><a href="#" class="footer-link">Bantuan</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4 class="footer-title">Hubungi Kami</h4>
      <p class="footer-small">Jl. Tech Raya No. 123, Jakarta Pusat (Area Peta Bebas)</p>
      <p class="footer-small">Jam Operasional: 09:00 - 18:00 WIB</p>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="footer-small">&copy; 2026 TokoKomputer. Hak cipta dilindungi.</p>
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
  if (name === "help") renderHelp();
  renderBadges();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    <input type="search" id="search-input" placeholder="Cari nama atau deskripsi produk..." aria-label="Cari produk" />
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
  const categorySelect = panel.querySelector("#category-select");
  const brandSelect = panel.querySelector("#brand-select");
  const sortSelect = panel.querySelector("#sort-select");

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
            const heart = wishlist.includes(p.id) ? "♥" : "♡";
            const compared = loadCompare().includes(p.id);
      return `<article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(p.nama)}">
        <div class="card-media">
          ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" loading="lazy" />` : `<div class="ph">Foto produk</div>`}
          <span class="wishlist-heart ${wishlist.includes(p.id) ? "aktif" : ""}" data-id="${escapeHtml(p.id)}" title="Wishlist">${heart}</span>
          ${badge}
        </div>
        <div class="card-body">
          <p class="cat">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p class="price">${rupiah(p.harga)} ${diskon}</p>
          <div class="card-rating">${bintang(p.rating)} <span>${Number(p.rating).toFixed(1)} (${p.reviewCount})</span></div>
          <p class="stok ${stokKelas}">${stokLabel}</p>
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

export function openProductModal(p) {
  const modal = document.getElementById("product-modal");
  if (!modal || !p) return;

  modal.dataset.id = p.id;
  const specs = Object.entries(p.specs || {});
  const reviews = Array.isArray(p.reviews) ? p.reviews : [];
  const related = allProducts.filter((x) => x.id !== p.id && x.kategori === p.kategori).slice(0, 3);
  const wishlisted = loadWishlist().includes(p.id);
  const diskon = p.originalPrice && p.originalPrice > p.harga
    ? `<s class="harga-lama">${rupiah(p.originalPrice)}</s>
       <span class="hemat">Hemat ${rupiah(p.originalPrice - p.harga)}</span>` : "";

  modal.innerHTML = `
<div class="modal-dialog" role="dialog" aria-modal="true" aria-label="Detail ${escapeHtml(p.nama)}">
  <button type="button" class="modal-close" data-modal-close aria-label="Tutup">×</button>
  <div class="modal-grid">
    <div class="modal-media">
      ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" />` : `<div class="ph">Foto produk</div>`}
      <div class="modal-thumbs" aria-hidden="true">
        ${[1, 2, 3].map((n) => `<span class="thumb ${n === 1 ? "aktif" : ""}">0${n}</span>`).join("")}
      </div>
    </div>

    <div class="modal-info">
      <div class="modal-breadcrumb">Katalog / ${escapeHtml(p.kategori)} / ${escapeHtml(p.nama)}</div>
      <span class="eyebrow">${escapeHtml(p.kategori)}${p.brand ? " · " + escapeHtml(p.brand) : ""}</span>
      <h2>${escapeHtml(p.nama)}</h2>
      <div class="modal-rating">${bintang(p.rating)} <strong>${Number(p.rating).toFixed(1)}</strong> <span class="muted">${p.reviewCount} ulasan</span></div>
      <div class="modal-harga">${rupiah(p.harga)} ${diskon}</div>
      <p class="stok ${p.stok > 0 ? "stok-ada" : "stok-habis"}">${p.stok > 0 ? "Stok tersedia: " + p.stok : "Stok habis"}</p>
      <p class="modal-deskripsi">${escapeHtml(p.deskripsi || "")}</p>

      <div class="modal-qty-row">
        <label for="modal-qty">Jumlah</label>
        <div class="qty-control">
          <button type="button" data-qty="-1" aria-label="Kurangi">−</button>
          <input id="modal-qty" type="number" min="1" max="${Math.max(1, p.stok)}" value="1" />
          <button type="button" data-qty="1" aria-label="Tambah">+</button>
        </div>
      </div>

      <div class="modal-buttons">
        <button type="button" class="btn-primary" data-modal-action="cart" ${p.stok <= 0 ? "disabled" : ""}>Tambah ke keranjang</button>
        <button type="button" class="btn-secondary" data-modal-action="wa" ${p.stok <= 0 ? "disabled" : ""}>Pesan via WhatsApp</button>
        <button type="button" class="btn-secondary ${wishlisted ? "wish-aktif" : ""}" data-modal-action="wishlist">${wishlisted ? "♥ Tersimpan" : "♡ Wishlist"}</button>
      </div>
    </div>
  </div>

  <div class="modal-sections">
    <section class="modal-panel">
      <h3>Spesifikasi</h3>
      ${specs.length
        ? `<dl class="spec-list">${specs.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}</dl>`
        : `<p class="muted">Spesifikasi belum tersedia.</p>`}
    </section>
    <section class="modal-panel">
      <h3>Ulasan pembeli <span class="count-badge">${reviews.length}</span></h3>
      ${reviews.length
        ? `<ul class="review-list">${reviews.map((r) => `<li>
            <div class="review-head">${bintang(r.rating)} <strong>${escapeHtml(r.nama || "Pembeli")}</strong> <time>${escapeHtml(r.tanggal || "")}</time></div>
            <p>${escapeHtml(r.komentar || "")}</p>
          </li>`).join("")}</ul>`
        : `<p class="muted">Belum ada ulasan.</p>`}
    </section>
  </div>

  ${related.length ? `<section class="modal-related">
    <h3>Produk terkait</h3>
    <div class="related-grid">
      ${related.map((r) => `<button type="button" class="related-card" data-related="${escapeHtml(r.id)}">
        ${r.imageUrl ? `<img src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.nama)}" loading="lazy" />` : `<span class="ph">Foto</span>`}
        <strong>${escapeHtml(r.nama)}</strong>
        <span>${rupiah(r.harga)}</span>
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

  const qtyInput = modal.querySelector("#modal-qty");
  modal.querySelector(".modal-grid").addEventListener("click", (e) => {
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
      addToCart(loadCart(), p.id, qty);
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
    } else if (kind === "wishlist") {
      const next = toggleWishlist(loadWishlist(), p.id);
      const aktif = next.includes(p.id);
      action.textContent = aktif ? "♥ Tersimpan" : "♡ Wishlist";
      action.classList.toggle("wish-aktif", aktif);
      toast(aktif ? "Disimpan ke wishlist." : "Dihapus dari wishlist.", "ok");
      renderBadges();
    }
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
function renderCart(list) {
  const panel = document.getElementById("view-cart");
  if (!panel) return;

  const total = cartTotal(allProducts, list);
  const baris = list.map((item) => {
    const p = allProducts.find((x) => x.id === item.id);
    return `<tr>
      <td>${escapeHtml(p ? p.nama : item.id)}</td>
      <td>${p ? rupiah(p.harga) : "—"}</td>
      <td><input type="number" min="1" value="${item.qty}" data-id="${escapeHtml(item.id)}" class="qty-input" aria-label="Jumlah ${escapeHtml(p ? p.nama : item.id)}" /></td>
      <td>${p ? rupiah(p.harga * item.qty) : "—"}</td>
      <td><button type="button" class="btn-small danger hapus-dari-cart" data-id="${escapeHtml(item.id)}">Hapus</button></td>
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
  <div class="cart-footer">
    <div class="cart-total"><span>Total</span><strong>${rupiah(total)}</strong></div>
    <div class="cart-actions">
      <button type="button" class="btn-primary" id="bayar-wa" ${list.length === 0 ? "disabled" : ""}>Bayar via WhatsApp</button>
      <button type="button" class="btn-secondary" id="kosongkan-cart" ${list.length === 0 ? "disabled" : ""}>Kosongkan</button>
    </div>
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
}

function renderHelp() {
  const panel = document.getElementById("view-help");
  if (!panel) return;
  panel.innerHTML = `<section class="info-page"><span class="eyebrow">Pusat Bantuan</span><h1>Butuh bantuan?</h1><p class="lead">Kami bantu pilih produk, cek stok, dan proses pesanan.</p><div class="help-grid"><article><b>Bagaimana cara pesan?</b><p>Pilih produk, masukkan keranjang, lalu klik Bayar via WhatsApp.</p></article><article><b>Apakah stok real-time?</b><p>Ya. Label stok diperbarui dari katalog dan produk habis tidak bisa dipesan.</p></article><article><b>Butuh rekomendasi?</b><p>Bandingkan maksimal tiga produk sebelum membeli.</p></article></div><a class="btn-primary" href="https://wa.me/6281234567890" target="_blank" rel="noopener">Chat admin</a></section>`;
}

function renderWishlist(list) {
  const panel = document.getElementById("view-wishlist");
  if (!panel) return;

  const items = list.map((id) => allProducts.find((x) => x.id === id)).filter(Boolean);
  panel.innerHTML = `
<div class="wishlist-panel panel">
  <div class="section-head"><div><span class="eyebrow">Favorit</span><h2>Wishlist Saya</h2></div><span class="count-badge">${items.length} item</span></div>
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
}


function renderOrders() {
  const panel = document.getElementById("view-orders");
  if (!panel) return;
  const orders = loadOrders();
  panel.innerHTML = orders.length ? `<div class="orders-list">${orders.map((o) => `<article class="order-item"><strong>Pesanan #${escapeHtml(String(o.id))}</strong><p>${new Date(o.createdAt).toLocaleDateString("id-ID")}</p>${o.items.map((i) => `<span>${escapeHtml(allProducts.find((p) => p.id === i.id)?.nama || "Produk")} × ${i.qty}</span>`).join(" · ")}<p>Total: ${rupiah(o.total || o.items.reduce((sum, i) => sum + (allProducts.find((p) => p.id === i.id)?.harga || 0) * i.qty, 0))}</p></article>`).join("")}</div>` : `<p class="muted">Anda belum memiliki riwayat pesanan.</p>`;
}

function renderVouchers() {
  const panel = document.getElementById("view-vouchers");
  if (!panel) return;
  const claims = loadVoucherClaims();
  panel.innerHTML = `<section class="info-page"><h2>Voucher Saya</h2><p>Gunakan kode voucher untuk klaim promo.</p><form class="voucher-form"><label for="voucher-code">Kode voucher</label><input id="voucher-code" required maxlength="40" autocomplete="off"><button class="btn-primary" type="submit">Klaim voucher</button></form>${claims.map((v) => `<p class="voucher-item">${escapeHtml(v.code)} — ${escapeHtml(v.status || "aktif")}</p>`).join("")}</section>`;
  panel.querySelector(".voucher-form")?.addEventListener("submit", (e) => { e.preventDefault(); const code = panel.querySelector("#voucher-code").value.trim(); if (code) { claimVoucher(code); toast("Voucher diklaim.", "ok"); renderVouchers(); } });
}
