import "./style.css";
import { loadProducts, getNotice } from "./store.js";
import { renderShell, renderCatalog, toast, setToastHandler } from "./ui.js";
import { renderDashboard } from "./dashboard.js";

setToastHandler(toast);

let list = loadProducts();

// Render shell, katalog, dan register callback dashboard
renderShell();
renderCatalog(list);

function refreshAll() {
  list = loadProducts();
  renderCatalog(list);
  renderDashboard(list, refreshAll);
}

// Tampilkan pemberitahuan data rusak bila ada
const notice = getNotice();
if (notice) {
  toast(notice.message, notice.type);
}

renderDashboard(list, refreshAll);