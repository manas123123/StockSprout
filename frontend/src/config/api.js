const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

let csrfRequest;

export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '');

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(prefix.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function getCsrfToken() {
  const existingToken = readCookie(CSRF_COOKIE_NAME);
  if (existingToken) {
    return existingToken;
  }

  if (!csrfRequest) {
    csrfRequest = fetch(apiUrl('/api/auth/csrf'), {
      credentials: 'include',
    });
  }

  try {
    const response = await csrfRequest;
    if (!response.ok) {
      throw new Error(`Unable to initialize CSRF protection (${response.status})`);
    }
  } finally {
    csrfRequest = null;
  }

  const token = readCookie(CSRF_COOKIE_NAME);
  if (!token) {
    throw new Error('The CSRF cookie was not returned by the API');
  }
  return token;
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (!SAFE_METHODS.has(method)) {
    headers.set(CSRF_HEADER_NAME, await getCsrfToken());
  }

  return fetch(apiUrl(path), {
    ...options,
    method,
    headers,
    credentials: options.credentials ?? 'include',
  });
}
