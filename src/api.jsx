// src/api.js
// База API твоего Rails-приложения
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "https://shoptest-fmov.onrender.com";

// --- Хранение JWT ---
let _token = null;
export const getToken = () => _token || localStorage.getItem('jwt') || null;
export const setToken = (t) => {
  _token = t;
  if (t) localStorage.setItem('jwt', t);
  else localStorage.removeItem('jwt');
};

// Читаем JWT, который сервер кладёт в заголовок Authorization
const readAuthHeader = (res) => {
  const h = res.headers.get('Authorization');
  if (h && h.startsWith('Bearer ')) setToken(h.slice(7));
};

// Безопасный парсинг JSON (на случай пустого тела)
const toJson = async (res) => {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
};

// Универсальный fetch-обёртка с подстановкой JWT и разбором ошибок {error,message}
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (auth && t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  // Если сервер прислал новый токен в заголовке — сохраним
  readAuthHeader(res);

  if (!res.ok) {
    const data = await toJson(res);
    const err = new Error(data.message || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.code = data.error || 'unknown_error';
    throw err;
  }
  return toJson(res);
}

// --- Специализированные вызовы под твою спецификацию ---

// Devise (JSON): регистрация/логин/логаут
export const AuthAPI = {
  // Возвращаем JSON из ответа (у тебя там профиль юзера),
  // токен читается из заголовка Authorization в readAuthHeader
  register: async (user) => {
    const r = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    readAuthHeader(r);
    if (!r.ok) throw await r.json();
    return r.json().catch(() => ({})); // вернём профиль, если он есть
  },

  login: async (user) => {
    const r = await fetch(`${API_BASE}/users/sign_in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    });
    readAuthHeader(r);
    if (!r.ok) throw await r.json();
    // В некоторых реализациях Devise body может быть пустым — вернём {}
    return r.json().catch(() => ({}));
  },

  logout: () => api('/users/sign_out', { method: 'DELETE', auth: true })
};


// Товары (список/поиск и карточка; публичные — без токена)
export const ItemsAPI = {
  list: (q = '') =>
    api(`/api/v1/items${q ? `?q=${encodeURIComponent(q)}` : ''}`, { auth: false }),
  show: (id) => api(`/api/v1/items/${id}`, { auth: false })
};

// Профиль текущего пользователя (для загрузки me после логина)
export const ProfileAPI = {
  me: () => api('/api/v1/profile'),
  update: (user) => api('/api/v1/profile', { method: 'PATCH', body: { user } })
};


// --- Orders API: list/my orders (GET), details (GET), create (POST) ---
export const OrdersAPI = {
  // user sees only own orders; admin – all (зависит от бэкенда)
  list: () => api('/api/v1/orders'),
  show: (id) => api(`/api/v1/orders/${id}`),
  // body: { items: [{ item_id, quantity }, ...] }
  create: (items) => api('/api/v1/orders', { method: 'POST', body: { items } })
};


// --- Admin: Users CRUD ---
export const AdminUsersAPI = {
  list: () => api('/api/v1/users'),
  show: (id) => api(`/api/v1/users/${id}`),
  create: (user) => api('/api/v1/users', { method: 'POST', body: { user } }),
  update: (id, user) => api(`/api/v1/users/${id}`, { method: 'PATCH', body: { user } }),

  // ВАЖНО: передаём ТЕЛО в DELETE (id + confirm_email)
  remove: (id, email) =>
    api(`/api/v1/users/${id}`, {
      method: 'DELETE',
      body: { id, confirm_email: email },
    }),
};


// --- Admin: Items CRUD (в дополнение к list/show) ---

export const ItemsAPIEx = {
  create: (item) => api('/api/v1/items', { method: 'POST', body: { item } }),
  update: (id, item) => api(`/api/v1/items/${id}`, { method: 'PATCH', body: { item } }),
  remove: (id) => api(`/api/v1/items/${id}`, { method: 'DELETE' }), // <-- правильный URL
};
