/**
 * Photo Fetcher Service
 *
 * This module provides helper functions to fetch recent photo posts from a Pixelfed/Mastodon-compatible API.
 * It supports queries by:
 *   - One or more hashtags (OR logic between tags)
 *   - One or more user accounts (OR logic between users)
 *   - Both hashtags AND user accounts (AND logic between groups)
 *
 * Key points about the AND case (tags + users):
 *   - Many federated servers (including Pixelfed and Mastodon) cannot natively filter a user's posts by tag
 *     when the posts originate on a remote instance. Their "tag timeline" feature is incomplete across
 *     federation boundaries, so you can miss results if you rely on it.
 *   - To avoid this limitation, the AND case is implemented as:
 *       1. Fetch recent posts from the given users (pulling more than the requested `limit` to allow filtering).
 *       2. Filter locally by the given tags.
 *       3. Sort results by creation date and return the requested number of posts.
 *   - This ensures correctness at the cost of some extra network requests and local filtering work,
 *     but avoids silently missing posts that match the tags.
 *
 * All fetch functions respect a configurable `limit` and attempt to normalize returned posts so the
 * front end receives a consistent shape regardless of query type.
 */

import { get as apiGet } from '../api/pixelfedApi.js';
import { getAccessToken } from '../modules/auth.js';

/**
 * @typedef {{ limit:number }} FetchOptions
 */

function statusToPhotos(status) {
  if (!status || !Array.isArray(status.media_attachments)) return [];
  const base = {
    id: status.id,
    created_at: status.created_at,
    author: status.account ? {
      id: status.account.id,
      acct: status.account.acct,
      username: status.account.username,
      display_name: status.account.display_name,
      avatar: status.account.avatar
    } : undefined,
    author_display_name: status.account?.display_name,
    caption: status.content,
    post_url: status.url,
    location: status.location || status.place || status.geo || undefined,
    tags: Array.isArray(status.tags) ? status.tags.map(t => t.name) : []
  };
  const out = [];
  for (const m of status.media_attachments) {
    if (m?.type === 'image' && m.url) {
      out.push({
        ...base,
        url: m.url,
        preview_url: m.preview_url || m.url
      });
    }
  }
  return out;
}

function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
  }
  return out;
}

function intersectById(a, b) {
  const ids = new Set(b.map(p => p.id));
  return a.filter(p => ids.has(p.id));
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export async function getLatestPhotosForTags(tags, opts) {
  const token = await getAccessToken();
  const limit = clamp(Number(opts?.limit)||20, 1, 40);
  const per = clamp(Math.ceil(limit * 1.5), 10, 40);

  const all = [];
  for (const tRaw of tags) {
    const t = String(tRaw).replace(/^#/, '');
    const { data } = await apiGet(`/api/v1/timelines/tag/${encodeURIComponent(t)}`, token, { limit: per });
    if (Array.isArray(data)) {
      for (const st of data) all.push(...statusToPhotos(st));
    }
  }
  const wanted = new Set(tags.map(s => String(s).replace(/^#/, '').toLowerCase()));
  const filtered = all.filter(p => (p.tags||[]).some(tag => wanted.has(String(tag).toLowerCase())));
  filtered.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  return dedupeById(filtered).slice(0, limit);
}

export async function getLatestPhotosForUsers(accountIds, opts) {
  const token = await getAccessToken();
  const limit = clamp(Number(opts?.limit)||20, 1, 40);
  const per = clamp(Math.ceil(limit * 1.5), 10, 40);

  const all = [];
  for (const id of accountIds) {
    const { data } = await apiGet(`/api/v1/accounts/${encodeURIComponent(id)}/statuses`, token, {
      limit: per, exclude_replies: true
    });
    if (Array.isArray(data)) {
      for (const st of data) all.push(...statusToPhotos(st));
    }
  }
  all.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  return dedupeById(all).slice(0, limit);
}

export async function getLatestPhotosCompound(input, opts) {
  const tags = (input.tags || []).filter(Boolean).map(s => String(s).replace(/^#/, '').toLowerCase());
  const users = (input.accountIds || []).filter(Boolean);
  const limit = clamp(Number(opts?.limit)||20, 1, 40);

  if (tags.length && !users.length) return getLatestPhotosForTags(tags, { limit });
  if (users.length && !tags.length) return getLatestPhotosForUsers(users, { limit });

  // Safer AND semantics in a federated context:
  // Fetch user posts and filter locally by tags to avoid relying on per-server tag timelines.
  const userPosts = await getLatestPhotosForUsers(users, { limit: Math.ceil(limit * 3) });
  const wanted = new Set(tags.map(t => String(t).toLowerCase()));
  const filtered = userPosts.filter(p => (p.tags || []).some(tag => wanted.has(String(tag).toLowerCase())));

  filtered.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  return filtered.slice(0, limit);
}