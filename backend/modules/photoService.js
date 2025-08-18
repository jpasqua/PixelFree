/**
 * photoService.js
 *
 * Service layer for handling user profile photos.
 * Provides functions for uploading, retrieving, and deleting images,
 * abstracting away storage details (e.g., file system, cloud storage).
 */

import { getAccessToken } from './auth.js';

/**
 * @typedef {{ type:'tag', tag:string } | { type:'user', accountId:string } | { type:'public', localOnly?:boolean }} Source
 * @typedef {{ limit:number, source: Source }} FetchArgs
 */

/** @param {FetchArgs} opts */
export async function fetchPhotos(opts) {
  const instanceUrl = process.env.PIXELFED_INSTANCE || 'https://pixelfed.social';
  const token = await getAccessToken();

  const limit = Math.max(1, Math.min(40, Number(opts.limit) || 10));
  const src = opts.source;

  let endpoint;
  if (src.type === 'tag') {
    endpoint = new URL(`/api/v1/timelines/tag/${encodeURIComponent(src.tag)}`, instanceUrl);
    endpoint.searchParams.set('limit', String(limit * 2)); // grab a bit more; we’ll filter images only
  } else if (src.type === 'user') {
    endpoint = new URL(`/api/v1/accounts/${encodeURIComponent(src.accountId)}/statuses`, instanceUrl);
    endpoint.searchParams.set('limit', String(limit * 2));
  } else if (src.type === 'public') {
    endpoint = new URL(`/api/v1/timelines/public`, instanceUrl);
    endpoint.searchParams.set('limit', String(limit * 2));
    if (src.localOnly) endpoint.searchParams.set('local', 'true');
  } else {
    throw new Error('Unsupported source');
  }

  const res = await fetch(endpoint, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  const payload = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(`Pixelfed fetch failed (${res.status}) ${JSON.stringify(payload)}`);
  }

  // Normalize: images only → newest-first → slice to limit
  const photos = [];
  for (const s of payload) {
    const atts = Array.isArray(s.media_attachments) ? s.media_attachments : [];
    for (const m of atts) {
      if (m.type === 'image' && m.url) {
        photos.push({
          id: m.id || s.id,
          url: m.url,
          preview_url: m.preview_url || m.url,
          created_at: s.created_at,
          author: s.account ? {
            id: s.account.id,
            username: s.account.acct || s.account.username,
            url: s.account.url
          } : undefined,
          author_display_name: s.account?.display_name,
          caption: s.content,          // HTML
          post_url: s.url,
          location: s.location || s.place || s.geo, // if available
          tags: Array.isArray(s.tags) ? s.tags.map(t => t.name) : []
        });
      }
    }
  }

  photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return photos.slice(0, limit);
}
