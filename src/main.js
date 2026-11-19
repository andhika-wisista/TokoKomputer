import "./style.css";
import { loadProducts, getNotice } from "./store.js";
import { renderShell, renderCatalog, toast, setToastHandler } from "./ui.js";
import { renderDashboard } from "./dashboard.js";
import { getSession } from "./auth.js";
import { renderLoginScreen } from "./login.js";

setToastHandler(toast);

function boot() {
  let list = loadProducts();

  renderShell();
  renderCatalog(list);

  function refreshAll() {
    list = loadProducts();
    renderCatalog(list);
    renderDashboard(list, refreshAll);
  }

  renderDashboard(list, refreshAll);

  const notice = getNotice();
  if (notice) {
    toast(notice.message, notice.type);
  }
}

if (getSession()) {
  window.__boot = boot;
  boot();
} else {
  window.__boot = boot;
  renderLoginScreen(boot);
}