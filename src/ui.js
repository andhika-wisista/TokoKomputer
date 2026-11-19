import { getNotice, KATEGORI_VALID } from "./store.js";
import { escapeHtml } from "./utils/dom.js";
import { filterProducts } from "./utils/filter.js";
import { buildWhatsAppUrl } from "./utils/whatsapp.js";

const WA_PHONE = "+6281234567890";

// Ekspos toast ke dashboard
export function setToastHandler(fn) {
  window.showToast = fn;
}

// Shell global: navbar + dua panel (katalog & dashboard) + toast root
export function renderShell() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <header class="navbar">
      <div class="logo">Toko<span>komputer</span></div>
      <nav class="tabs" aria-label="Navigasi">
        <button type="button" class="tab active" data-view-tab="catalog">Katalog</button>
        <button type="button" class="tab" data-view-tab="dashboard">Dashboard Demo</button>
      </nav>
    </header>

    <main>
      <section id="view-catalog" data-view-panel></section>
      <section id="view-dashboard" data-view-panel hidden></section>
    </main>

    <footer class="footer">
      <p>&copy; 2026 Tokokomputer &mdash; data demo tersimpan di localStorage browser ini.</p>
    </footer>

    <div id="toast-root" aria-live="polite"></div>
  `;

  app.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.viewTab));
  });
}

export function showView(name) {
  const target = document.getElementById(`view-${name}`);
  if (!target) return;

  document.querySelectorAll("[data-view-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.viewTab === name);
  });

  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.hidden = panel.id !== `view-${name}`;
  });
}

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

export function renderCatalog(list) {
  const panel = document.getElementById("view-catalog");
  if (!panel) return;

  const categories = ["Semua", ...KATEGORI_VALID];

  const notice = getNotice();
  const noticeHtml = notice
    ? `<div class="notice ${notice.type}" role="alert">${escapeHtml(notice.message)}</div>`
    : "";

  panel.innerHTML = `
    <section class="hero">
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
            ${categories.map((c) => `<option value="${c}">${c}</option>`).join("")}
          </select>
          <select id="sort-select" aria-label="Urutkan">
            <option value="default">Urutan Default</option>
            <option value="harga-asc">Harga Termurah</option>
            <option value="harga-desc">Harga Termahal</option>
            <option value="nama-asc">Nama A&ndash;Z</option>
            <option value="nama-desc">Nama Z&ndash;A</option>
          </select>
        </div>
      </div>
      <div id="catalog-grid" class="grid"></div>
    </section>
  `;

  const grid = document.getElementById("catalog-grid");
  const searchInput = document.getElementById("search-input");
  const categorySelect = document.getElementById("category-select");
  const sortSelect = document.getElementById("sort-select");

  let filtered = [...list];

  function renderItems(items) {
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>Tidak ada produk yang cocok dengan pencarian Anda.</p></div>`;
      return;
    }

    grid.innerHTML = items
      .map((p) => {
        const harga = `Rp ${p.harga.toLocaleString("id-ID")}`;
        const stokLabel = p.stok > 0 ? `Stok: ${p.stok}` : "Stok: 0 (Habis)";
        const disabled = p.stok <= 0 ? "disabled" : "";
        const badge = p.unggulan ? `<span class="badge">Unggulan</span>` : "";

        return `
          <article class="card">
            <div class="card-media">
              ${p.imageUrl
                ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.nama)}" />`
                : `<div class="ph" role="img" aria-label="placeholder foto ${escapeHtml(p.nama)}">Foto</div>`}
            </div>
            <h3>${escapeHtml(p.nama)}</h3>
            <p class="cat">${escapeHtml(p.kategori)}</p>
            <p class="price">${harga}</p>
            <p class="stok">${escapeHtml(stokLabel)}</p>
            ${badge}
            <button class="wa" type="button" ${disabled}
              data-phone="${WA_PHONE}"
              data-name="${escapeHtml(p.nama)}"
              data-price="${p.harga}"
              data-desc="${escapeHtml(p.deskripsi || "")}">
              Pesan via WhatsApp
            </button>
          </article>
        `;
      })
      .join("");
  }

  function update() {
    const q = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sort = sortSelect.value;

    filtered = filterProducts(list, {
      query: q,
      category,
      sort,
    });

    renderItems(filtered);
  }

  searchInput.addEventListener("input", update);
  categorySelect.addEventListener("change", update);
  sortSelect.addEventListener("change", update);

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".wa");
    if (!btn || btn.disabled) return;

    const name = btn.dataset.name;
    const price = btn.dataset.price;
    const desc = btn.dataset.desc;
    const product = { nama: name, harga: Number(price), deskripsi: desc };
    try {
      const url = buildWhatsAppUrl(WA_PHONE, product);
      window.open(url, "_blank");
    } catch (err) {
      toast("Error: " + err.message, "error");
    }
  });

  renderItems(filtered);
}