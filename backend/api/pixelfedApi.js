/**
 * pixelfedApi.js
 * ----------------
 * This module provides functions for interacting with the Pixelfed API from the frontend.
 * It encapsulates all network calls related to Pixelfed instances, posts, and user data,
 * serving as a dedicated API layer between the frontend UI components and the remote server.
 *
 * Responsibilities:
 *   - Constructing and sending HTTP requests to the Pixelfed API.
 *   - Handling authentication tokens (if applicable).
 *   - Parsing and returning JSON responses for use in the frontend.
 *   - Abstracting away API endpoint details to simplify usage elsewhere in the app.
 *
 * Exports:
 *   - Functions to query Pixelfed servers for posts, accounts, media, etc.
 *   - Utility methods for managing pagination and search requests.
 *
 * Usage:
 *   Import this module in frontend components or other API utilities that need
 *   to interact with Pixelfed:
 *
 *     import { searchPixelfed, getPostDetails } from './api/pixelfedApi.js';
 *
 *     const results = await searchPixelfed('otters');
 *     console.log(results);
 *
 * Notes:
 *   - Error handling: All functions should throw errors on failed requests
 *     so that callers can handle them gracefully.
 *   - This file should remain focused purely on Pixelfed API logic and not
 *     contain any UI or DOM code.
 */

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
