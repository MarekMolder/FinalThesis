const API_BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    logout();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Register failed');
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export function isLoggedIn() {
  return !!getToken();
}

/** Remove token (e.g. logout). Redirect to /login optional. */
export function logout() {
  localStorage.removeItem('token');
}

function base64UrlDecode(input) {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  try {
    // atob expects Latin1; JWT payload is JSON ASCII/UTF-8 safe for typical claims
    return atob(base64);
  } catch {
    return null;
  }
}

/** Returns user info derived from JWT (email from `sub`, role from `role`). */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const json = base64UrlDecode(parts[1]);
  if (!json) return null;
  try {
    const payload = JSON.parse(json);
    return {
      email: payload.sub || payload.email || null,
      role: payload.role || null,
      label: payload.role === 'ADMIN' ? 'Admin' : 'Õpetaja',
    };
  } catch {
    return null;
  }
}

// CRUD helpers (return .content for list when it's a page)
export const curriculum = {
  list: (params) => api('/curriculum?' + new URLSearchParams(params || {})).then((p) => p.content ?? p),
  /** Süsteemi õppekavad: PUBLIC, externalGraph=false, not owned by current user. */
  systemList: (params) => api('/curriculum/system?' + new URLSearchParams(params || {})).then((p) => p.content ?? p),
  /** Graafist imporditud õppekavad (DB-s, externalGraph=true). */
  listExternal: (params) => api('/curriculum/external?' + new URLSearchParams(params || {})).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum/${id}`),
  /** For external curricula: graph structure (modules, learning outcomes). */
  getGraphStructure: (id) => api(`/curriculum/${id}/graph-structure`),
  /** Imporditud õppekava struktuur DB-st (EELDAB/KOOSNEB jms). */
  getImportedStructure: (id) => api(`/curriculum/${id}/imported-structure`),
  create: (body) => api('/curriculum', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum/${id}`, { method: 'DELETE' }),
};

/** Graafist (oppekava.edu.ee) – loetelu ja sünk DB-sse. */
export const graph = {
  /** Loetelu graafist (mitte DB). */
  curricula: () => api('/graph/curricula'),
  /** Impordi puuduvad õppekavad graafist DB-sse (externalGraph=true, versioon CLOSED). */
  sync: () => api('/graph/sync', { method: 'POST' }),
};

export const curriculumVersion = {
  list: (curriculumId, params) =>
    api('/curriculum-version?' + new URLSearchParams({ curriculumId, ...params })).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum-version/${id}`),
  create: (body) => api('/curriculum-version', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum-version/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum-version/${id}`, { method: 'DELETE' }),
};

export const curriculumItem = {
  list: (curriculumVersionId, params) =>
    api('/curriculum-item?' + new URLSearchParams({ curriculumVersionId, ...params })).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum-item/${id}`),
  create: (body) => api('/curriculum-item', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum-item/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum-item/${id}`, { method: 'DELETE' }),
};

export const schedule = {
  list: (curriculumItemId, params) =>
    api('/curriculum-item-schedule?' + new URLSearchParams({ curriculumItemId, ...params })).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum-item-schedule/${id}`),
  create: (body) => api('/curriculum-item-schedule', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum-item-schedule/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum-item-schedule/${id}`, { method: 'DELETE' }),
};

export const relation = {
  list: (curriculumVersionId, params) =>
    api('/curriculum-item-relation?' + new URLSearchParams({ curriculumVersionId, ...params })).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum-item-relation/${id}`),
  create: (body) => api('/curriculum-item-relation', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum-item-relation/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum-item-relation/${id}`, { method: 'DELETE' }),
};

export const timeline = {
  blocks: (curriculumVersionId) => api(`/curriculum-version/${curriculumVersionId}/timeline-blocks`),
};
