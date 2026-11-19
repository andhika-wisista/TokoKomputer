import { login } from "./auth.js";

export function renderLoginScreen(onSuccess) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="login-screen" id="login-screen">
      <div class="login-card">
        <div class="login-brand">
          <span class="eyebrow">TokoKomputer</span>
          <h2>Masuk ke Akun</h2>
          <p class="login-sub">Gunakan akun demo untuk mencoba fitur.</p>
        </div>

        <form id="login-form" novalidate>
          <label class="field">
            <span>Username</span>
            <input id="login-username" type="text" autocomplete="username" placeholder="Masukkan username" required />
          </label>
          <label class="field">
            <span>Password</span>
            <input id="login-password" type="password" autocomplete="current-password" placeholder="Masukkan password" required />
          </label>
          <button class="btn-primary btn-block" type="submit">Masuk</button>
        </form>

        <div class="login-divider"><span>Atau gunakan akun demo</span></div>

        <div class="login-demo">
          <button type="button" class="btn-outline" data-demo-user="admin / admin123">
            <span class="demo-badge admin">Admin</span>
            <span>admin / admin123</span>
          </button>
          <button type="button" class="btn-outline" data-demo-user="user / user123">
            <span class="demo-badge user">User</span>
            <span>user / user123</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const form = app.querySelector("#login-form");
  const usernameInput = app.querySelector("#login-username");
  const passwordInput = app.querySelector("#login-password");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const session = login(username, password);
    if (!session) {
      window.showToast?.("Login gagal. Username atau password salah.", "error");
      return;
    }
    app.querySelector("#login-screen")?.remove();
    window.showToast?.("Login berhasil.", "success");
    if (typeof onSuccess === "function") onSuccess();
  });

  app.querySelectorAll("[data-demo-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const txt = btn.getAttribute("data-demo-user") || "";
      const [u, p] = txt.split(" / ");
      if (usernameInput) usernameInput.value = u || "";
      if (passwordInput) passwordInput.value = p || "";
      if (usernameInput) usernameInput.focus();
      if (passwordInput) passwordInput.focus();
    });
  });
}
