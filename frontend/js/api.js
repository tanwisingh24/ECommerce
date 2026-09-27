// Change this if your backend runs on a different host/port.
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Wrapper around fetch() that:
 * - Prefixes API_BASE_URL
 * - Attaches the JWT (if present) as a Bearer token
 * - Parses JSON and throws on non-2xx responses with the server's message
 */
async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch (_) { /* empty body */ }

  if (!res.ok) {
    const message = data.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  del: (path) => apiRequest(path, { method: 'DELETE' })
};
