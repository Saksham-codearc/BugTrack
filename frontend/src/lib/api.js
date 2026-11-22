const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'bugtrack_token';

export const tokenStore = {
  get: () => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (_error) {
      return null;
    }
  },
  set: (token) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch (_error) {
      // Storage can be disabled in private browsing; the in-memory session still works.
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (_error) {
      // Ignore.
    }
  },
};

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  fieldError(field) {
    return this.errors?.find((error) => error.field === field)?.message;
  }
}

async function request(path, { method = 'GET', body, formData = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (_error) {
    throw new ApiError(
      'Could not reach the server. Make sure the API is running and your connection is stable.',
      0
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && !path.includes('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('bugtrack:unauthorized'));
    }
    throw new ApiError(data?.message || 'The request failed. Please try again.', response.status, data?.errors);
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, formData: true }),
};

export const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const API_ORIGIN = API_URL.replace(/\/api$/, '');
export const assetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

export { API_URL, SOCKET_URL };
