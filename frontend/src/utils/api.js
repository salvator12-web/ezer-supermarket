import { auth } from '../config/firebase.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function authHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request(path, { method = 'GET', body, auth: withAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) Object.assign(headers, await authHeader());

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty/non-JSON response */
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path, opts = {}) => request(path, opts),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts = {}) => request(path, { method: 'PATCH', body, ...opts }),
  del: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
};
