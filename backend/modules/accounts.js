// modules/accounts.js
import { getAccessToken } from './auth.js';

function baseUrl() {
  return process.env.PIXELFED_INSTANCE || 'https://pixelfed.social';
}

function normalizeAcct(acct) {
  let s = String(acct || '').trim().replace(/^@/, '');

  // Allow profile URLs like https://mastodon.sdf.org/@icm
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      const m = u.pathname.match(/\/@([^/]+)/);
      if (m) s = `${m[1]}@${u.hostname}`;
    }
  } catch { /* ignore */ }

  // If remote, ensure domain looks valid
  if (s.includes('@')) {
    const [, host] = s.split('@');
    if (!host || !host.includes('.')) {
      throw new Error(`Bad acct: domain appears incomplete for "${acct}". Include the full domain, e.g. "@user@host.tld"`);
    }
  }
  return s;
}

/**
 * Resolve a user handle (acct) to an account ID.
 * Accepts "name", "@name", "name@domain", "@name@domain".
 * Uses /api/v2/search?resolve=true for remote handles, falls back to v1 lookup/search.
 */
export async function resolveAccountId(acct) {
  const clean = normalizeAcct(acct);
  const token = await getAccessToken();
  const base = baseUrl();
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

  // 1) Try v2 search with resolve=true (works for remote accounts)
  // GET /api/v2/search?q=:acct&resolve=true&type=accounts&limit=1
  try {
    const u = new URL('/api/v2/search', base);
    u.searchParams.set('q', clean);
    u.searchParams.set('resolve', 'true');
    u.searchParams.set('type', 'accounts');
    u.searchParams.set('limit', '1');
    const res = await fetch(u, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data?.accounts?.length && data.accounts[0]?.id) {
        return data.accounts[0].id;
      }
    }
  } catch { /* continue */ }

  // 2) If it looks local (no domain part), try v1 lookup (fast local path)
  if (!clean.includes('@')) {
    try {
      const u = new URL('/api/v1/accounts/lookup', base);
      u.searchParams.set('acct', clean);
      const res = await fetch(u, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data?.id) return data.id;
      }
    } catch { /* continue */ }
  }

  // 3) Fallback: v1 accounts/search (local search)
  try {
    const u = new URL('/api/v1/accounts/search', base);
    u.searchParams.set('q', clean);
    u.searchParams.set('limit', '1');
    const res = await fetch(u, { headers });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list[0]?.id) return list[0].id;
    }
  } catch { /* continue */ }

  throw new Error(`Unable to resolve acct "${acct}" to an account ID`);
}

const _acctCache = new Map(); // acct -> accountId

export async function resolveManyAccts(accts) {
  const clean = Array.from(new Set((accts || []).map(a => String(a || '').trim()).filter(Boolean)));
  const resolved = [];
  for (const acct of clean) {
    if (_acctCache.has(acct)) {
      resolved.push(_acctCache.get(acct));
      continue;
    }
    const id = await resolveAccountId(acct);
    if (id) {
      _acctCache.set(acct, id);
      resolved.push(id);
    }
  }
  return Array.from(new Set(resolved));
}
