// Business logic to fetch photos from Pixelfed (normalize results)
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
  const tags = (input.tags || []).filter(Boolean);
  const users = (input.accountIds || []).filter(Boolean);
  const limit = clamp(Number(opts?.limit)||20, 1, 40);

  if (tags.length && !users.length) return getLatestPhotosForTags(tags, { limit });
  if (users.length && !tags.length) return getLatestPhotosForUsers(users, { limit });

  const [A, B] = await Promise.all([
    getLatestPhotosForTags(tags, { limit: Math.ceil(limit*2) }),
    getLatestPhotosForUsers(users, { limit: Math.ceil(limit*2) }),
  ]);
  const inter = intersectById(A, B);
  inter.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
  return inter.slice(0, limit);
}
