import { contractFetch } from './index.js';
import {
  loginContract,
  refreshContract,
  logoutContract,
  meContract,
} from '@/lib/contracts/v1/auth.js';

/**
 * Authenticates user credentials via POST /api/v1/auth/login.
 *
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @param {object} [options={}]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function login({ email, password }, options = {}) {
  const result = await contractFetch(loginContract, {
    ...options,
    body: { email, password },
  });
  return result.data;
}

/**
 * Refreshes an active session via POST /api/v1/auth/refresh.
 *
 * @param {object} [params={}]
 * @param {string} [params.token] - Optional explicit Bearer token
 * @param {object} [options={}]
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function refresh({ token } = {}, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await contractFetch(refreshContract, {
    ...options,
    headers,
    body: token ? { token } : undefined,
  });
  return result.data;
}

/**
 * Revokes current session token and clears cookies via POST /api/v1/auth/logout.
 *
 * @param {object} [params={}]
 * @param {string} [params.token] - Optional explicit token to revoke
 * @param {object} [options={}]
 * @returns {Promise<{ ok: boolean }>}
 */
export async function logout({ token } = {}, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await contractFetch(logoutContract, {
    ...options,
    headers,
    body: token ? { token } : undefined,
  });
  return result.data;
}

/**
 * Retrieves the current session user via GET /api/v1/auth/me.
 *
 * @param {object} [params={}]
 * @param {string} [params.token] - Optional explicit Bearer token
 * @param {object} [options={}]
 * @returns {Promise<{ user: object | null }>}
 */
export async function getCurrentUser({ token } = {}, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const result = await contractFetch(meContract, {
    ...options,
    headers,
  });
  return result.data;
}
