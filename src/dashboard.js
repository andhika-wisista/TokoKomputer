import { KATEGORI_VALID, validateProduct, generateId, upsertProduct, deleteProduct, resetProducts, importProducts, exportProducts } from "./store.js";
import { escapeHtml } from "./utils/dom.js";

export function renderDashboard(list, onChange) {
  const root = document.getElementById("view-dashboard");
  if (!root) return;

  const totalProduk = list.length;
  const totalStok = list.reduce((s, p) => s + p.stok, 0);
  const kategoriHitung = KATEGORI_VALID.map((k) => [k, list.filter((p) => p.kategori === k).length]);
  const unggulan = list.filter((p) => p.unggulan).length;

  root.innerHTML = `
    <div class="dash-section">
      <h2>Dashboard Demo</h2>
      <p class="muted">Kelola data produk demo. Perubahan langsung tampil di katalog publik.</p>

      <div class="stats-grid">
        <div class="stat"><div class="stat-num">${totalProduk}</div><div class="stat-label">Total Produk</div></div>
        <div class="stat"><div class="stat-num">${totalStok}</div><div class="stat-label">Total Stok</div></div>
        <div class="stat"><div class="stat-num">${KATEGORI_VALID.length}</div><div class="stat-label">Kategori</div></div>
        <div class="stat"><div class="stat-num">${unggulan}</div><div class="stat-label">Unggulan</div></div>
      </div>

      <div class="kategori-chips">
        ${kategoriHitung.map(([k, c]) => `<span class="chip">${escapeHtml(k)}: ${c}</span>`).join("")}
      </div>

      <div class="dash-grid">
        <section class="panel">
          <h3>Tabel Produk</h3>
          <div class="table-wrap">
            <table>
              <caption class="sr-only">Daftar produk</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nama</th>
                  <th scope="col">Kategori</th>
                  <th scope="col">Harga</th>
                  <th scope="col">Stok</th>
                  <th scope="col">Unggulan</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${list
                  .map(
                    (p) => `
                  <tr>
                    <td>${escapeHtml(p.id)}</td>
                    <td>${escapeHtml(p.nama)}</td>
                    <td>${escapeHtml(p.kategori)}</td>
                    <td>Rp ${p.harga.toLocaleString("id-ID")}</td>
                    <td>${p.stok}</td>
                    <td>${p.unggulan ? "Ya" : "Tidak"}</td>
                    <td class="row-actions">
                      <button type="button" class="btn-small" data-edit="${escapeHtml(p.id)}">Edit</button>
                      <button type="button" class="btn-small danger" data-delete="${escapeHtml(p.id)}">Hapus</button>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <h3 id="form-title">Tambah Produk</h3>
          <form id="product-form" novalidate>
            <input type="hidden" id="f-id" />
            <label>Nama <input id="f-nama" type="text" required /></label>
            <label>Kategori
              <select id="f-kategori">${KATEGORI_VALID.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join("")}</select>
            </label>
            <label>Harga <input id="f-harga" type="number" min="0" step="1" required /></label>
            <label>Stok <input id="f-stok" type="number" min="0" step="1" required /></label>
            <label>Deskripsi <textarea id="f-deskripsi"></textarea></label>
            <label>URL Foto <input id="f-imageurl" type="text" placeholder="opsional" /></label>
            <p id="form-error" class="form-error" role="alert"></p>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Simpan</button>
              <button type="button" id="btn-batal" class="btn-secondary">Batal</button>
            </div>
          </form>
        </section>
      </div>

      <section class="panel">
        <h3>Data Demo</h3>
        <div class="dash-toolbar">
          <button type="button" id="btn-export" class="btn-secondary">Export JSON</button>
          <label class="btn-secondary" for="import-file">Import JSON</label>
          <input type="file" id="import-file" accept="application/json,.json" hidden />
          <button type="button" id="btn-reset" class="btn-danger">Reset Demo</button>
        </div>
      </section>
    </div>
  `;

  // Toast helper (via global dari ui.js jika ada, atau local)
  function toast(msg, type = "info") {
    if (window.showToast) window.showToast(msg, type);
    else alert(msg);
  }

  // Form handling
  const form = root.querySelector("#product-form");
  const errEl = root.querySelector("#form-error");
  const fId = root.querySelector("#f-id");
  const fNama = root.querySelector("#f-nama");
  const fKategori = root.querySelector("#f-kategori");
  const fHarga = root.querySelector("#f-harga");
  const fStok = root.querySelector("#f-stok");
  const fDeskripsi = root.querySelector("#f-deskripsi");
  const fImageUrl = root.querySelector("#f-imageurl");
  let fUnggulanState = false; // UI toggle removed; unggulan preserved silently
  const formTitle = root.querySelector("#form-title");

  function resetForm() {
    fId.value = "";
    fNama.value = "";
    fKategori.value = KATEGORI_VALID[0];
    fHarga.value = "";
    fStok.value = "";
    fDeskripsi.value = "";
    fImageUrl.value = "";
    fUnggulanState = false;
    errEl.textContent = "";
    formTitle.textContent = "Tambah Produk";
  }

  function fillForm(p) {
    fId.value = p.id;
    fNama.value = p.nama;
    fKategori.value = p.kategori;
    fHarga.value = p.harga;
    fStok.value = p.stok;
    fDeskripsi.value = p.deskripsi;
    fImageUrl.value = p.imageUrl;
    fUnggulanState = p.unggulan;
    errEl.textContent = "";
    formTitle.textContent = `Edit Produk: ${p.id}`;
    fNama.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errEl.textContent = "";
    const nama = fNama.value.trim();
    const kategori = fKategori.value;
    const hargaRaw = fHarga.value;
    const stokRaw = fStok.value;
    const deskripsi = fDeskripsi.value;
    const imageUrl = fImageUrl.value.trim();
    const unggulan = fUnggulanState;

    if (!hargaRaw) { errEl.textContent = "Harga wajib diisi."; return; }
    if (!stokRaw) { errEl.textContent = "Stok wajib diisi."; return; }
    const harga = Number(hargaRaw);
    const stok = Number(stokRaw);
    if (!Number.isFinite(harga) || harga < 0) { errEl.textContent = "Harga harus angka >= 0."; return; }
    if (!Number.isInteger(stok) || stok < 0) { errEl.textContent = "Stok harus bilangan bulat >= 0."; return; }

    const id = fId.value || generateId(list);
    const product = {
      id,
      nama,
      kategori,
      harga,
      stok,
      deskripsi,
      imageUrl,
      unggulan,
    };

    try {
      const errs = validateProduct(product);
      if (errs.length) throw new Error(errs.join("; "));
      const next = upsertProduct(list, product);
      onChange(next);
      toast(fId.value ? "Produk diperbarui." : "Produk ditambahkan.", "ok");
      resetForm();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  root.querySelector("#btn-batal").addEventListener("click", resetForm);

  // Edit & Delete buttons
  root.querySelector("tbody").addEventListener("click", (e) => {
    if (e.target.matches("[data-edit]")) {
      const id = e.target.dataset.edit;
      const p = list.find((x) => x.id === id);
      if (p) fillForm(p);
    }
    if (e.target.matches("[data-delete]")) {
      const id = e.target.dataset.delete;
      const p = list.find((x) => x.id === id);
      if (!p) return;
      if (confirm(`Hapus "${p.nama}"? Tindakan ini tidak dapat dibatalkan.`)) {
        try {
          const next = deleteProduct(list, id);
          onChange(next);
          toast("Produk dihapus.", "ok");
        } catch (err) {
          toast("Gagal hapus: " + err.message, "error");
        }
      }
    }
  });

  // Export
  root.querySelector("#btn-export").addEventListener("click", () => {
    try {
      const json = exportProducts(list);
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "rasanusa-produk.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Export berhasil.", "ok");
    } catch (err) {
      toast("Export gagal: " + err.message, "error");
    }
  });

  // Import
  root.querySelector("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importProducts(text);
      onChange(imported);
      toast(`Import berhasil: ${imported.length} produk.`, "ok");
    } catch (err) {
      toast("Import gagal: " + err.message, "error");
    } finally {
      e.target.value = "";
    }
  });

  // Reset
  root.querySelector("#btn-reset").addEventListener("click", () => {
    if (confirm("Reset data demo ke data contoh awal?")) {
      try {
        const next = resetProducts();
        onChange(next);
        toast("Data demo direset.", "ok");
      } catch (err) {
        toast("Reset gagal: " + err.message, "error");
      }
    }
  });
}