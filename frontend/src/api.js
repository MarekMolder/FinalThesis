const API_BASE = '/api/v1';

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || res.statusText);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
  if (data.userInfo) localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
  return data;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Register failed');
  if (data.userInfo) localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
  return data;
}

/** Returns user info from localStorage (email/role). Token never touches JS. */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const ui = JSON.parse(raw);
    return {
      email: ui.email || null,
      role: ui.role || null,
      label: ui.role === 'ADMIN' ? 'Admin' : 'Õpetaja',
    };
  } catch {
    return null;
  }
}

/** True if we have cached user info (JWT validity verified server-side per request). */
export function isLoggedIn() {
  return !!getCurrentUser();
}

/** Alias for isLoggedIn — session validity is enforced server-side via HttpOnly cookie. */
export function isAuthenticatedSession() {
  return isLoggedIn();
}

/** Call logout endpoint to clear HttpOnly cookie, wipe userInfo, redirect to login. */
export async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {}
  localStorage.removeItem('userInfo');
  if (typeof window !== 'undefined') window.location.assign('/login');
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
  getImportedStructure: (id, versionId) =>
    api(`/curriculum/${id}/imported-structure${versionId ? '?versionId=' + versionId : ''}`),
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
  /** Fetch content items related to a specific element by IRI. */
  itemsForElement: (iri) => api(`/graph/items-for-element?iri=${encodeURIComponent(iri)}`),
  /** Fetch content items by metadata (subject, schoolLevel, grade). */
  contentByMetadata: ({ subject, schoolLevel, grade }) => {
    const params = new URLSearchParams({ subject });
    if (schoolLevel) params.set('schoolLevel', schoolLevel);
    if (grade) params.set('grade', grade);
    return api(`/graph/items-by-metadata?${params}`);
  },
};

export const curriculumVersion = {
  list: (curriculumId, params) =>
    api('/curriculum-version?' + new URLSearchParams({ curriculumId, ...params })).then((p) => p.content ?? p),
  get: (id) => api(`/curriculum-version/${id}`),
  create: (body) => api('/curriculum-version', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/curriculum-version/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => api(`/curriculum-version/${id}`, { method: 'DELETE' }),
  duplicate: (id) =>
    api(`/curriculum-version/${id}/duplicate`, { method: 'POST' }),
  generateContentJson: (id) =>
    api(`/curriculum-version/${id}/generate-content-json`, { method: 'POST' }),
  diff: (versionAId, versionBId) =>
    api(`/curriculum-version/${versionAId}/diff/${versionBId}`),
  restore: (versionAId) =>
    api(`/curriculum-version/${versionAId}/restore`, { method: 'POST' }),
};

export const curriculumItem = {
  list: (curriculumVersionId, params) =>
    api('/curriculum-item?' + new URLSearchParams({ curriculumVersionId, size: 10000, ...params })).then((p) => p.content ?? p),
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

export const graphExplorer = {
  /** GraphViewDto for a curriculum + version. */
  get: (curriculumId, versionId) =>
    api(`/graph-explorer/${curriculumId}?versionId=${encodeURIComponent(versionId)}`),
  /** Expand a graph node by IRI; pass already-rendered IRIs to dedupe. */
  expand: (iri, excludeIris = []) => {
    const params = new URLSearchParams();
    params.set('iri', iri);
    excludeIris.forEach((x) => params.append('excludeIris', x));
    return api(`/graph-explorer/expand?${params.toString()}`);
  },
};

export const timeline = {
  blocks: (curriculumVersionId) => api(`/curriculum-version/${curriculumVersionId}/timeline-blocks`),
};

export const graphCatalog = {
  forMeta: (pageTitle) => api(`/graph/curriculum?pageTitle=${encodeURIComponent(pageTitle)}`),
  list: () => api('/graph/curricula'),
  taxonomy: () => api('/graph/taxonomy'),
  itemsByMetadata: (subject, schoolLevel, subjectArea, grade, educationLevel) => {
    const params = new URLSearchParams({ subject });
    if (schoolLevel) params.set('schoolLevel', schoolLevel);
    if (subjectArea) params.set('subjectArea', subjectArea);
    if (grade) params.set('grade', grade);
    if (educationLevel) params.set('educationLevel', educationLevel);
    return api(`/graph/items-by-metadata?${params}`);
  },
};

export const ai = {
  chat: (messages, versionId, step) =>
    api('/ai/chat', { method: 'POST', body: JSON.stringify({ messages, versionId, step }) }),
};

export const user = {
  getProfile: () => api('/users/me'),
  updateName: (name) => api('/users/me', { method: 'PUT', body: JSON.stringify({ name }) }),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    api('/users/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) }),
};
