// ponytail: auth demo client-side saja; produksi harus pakai server session + hashing.
const SESSION_KEY = "rasanusa:session:v1";

export const DEMO_USERS = [
  { username: "admin", password: "admin123", role: "admin", nama: "Admin TokoKomputer" },
  { username: "user", password: "user123", role: "user", nama: "Pelanggan" },
];

export function login(username, password) {
  const u = DEMO_USERS.find(
    (x) => x.username === username && x.password === password
  );
  if (!u) return null;
  const session = { username: u.username, role: u.role, nama: u.nama };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (
      !s ||
      typeof s.username !== "string" ||
      !["admin", "user"].includes(s.role)
    ) {
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  return null;
}

export function isAdmin(session) {
  return session?.role === "admin";
}