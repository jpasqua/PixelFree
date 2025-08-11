// Low-level Pixelfed API wrapper
import { withRetry } from '../utils/http.js';

/**
 * @template T
 * @param {string} path
 * @param {string} accessToken
 * @param {Record<string, string | number | boolean>} [params]
 * @returns {Promise<{ status:number, data:T }>}
 */
export async function get(path, accessToken, params = {}) {
  const base = process.env.PIXELFED_INSTANCE || 'https://pixelfed.social';
  const u = new URL(path, base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      u.searchParams.set(k, String(v));
    }
  }

  const doFetch = async () => {
    const res = await fetch(u, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    const status = res.status;
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(`Pixelfed GET ${u.pathname} failed (${status})`);
      err.status = status;
      err.data = data;
      throw err;
    }
    return { status, data };
  };

  return withRetry(doFetch, { retries: 3, baseDelayMs: 400 });
}
