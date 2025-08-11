// PixelFree/backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parsing
app.use(express.json());

// Serve static frontend test files from the "public" directory.
//
// This is here to support a minimal, throwaway frontend for testing the backend’s
// Pixelfed authentication and photo-fetch flow without requiring a full frontend
// build or separate dev server. It allows us to open a browser at the backend’s URL
// (e.g., http://localhost:3000) and interact with a basic HTML/JS page.
//
// Best practice: In the long term, we should remove or replace this with a proper
// dedicated frontend project (e.g., React or Vue) in its own directory, using a
// development proxy to the backend during local development. Keeping this here
// too long can lead to confusion between the test UI and the production UI.
//
// TL;DR — Quick demo now, separate frontend later.
app.use(express.static('public'));

// --- Import stub modules ---
import * as auth from './modules/auth.js';
import * as photoService from './modules/photoService.js';
import * as cache from './modules/cache.js';
import * as settings from './modules/settings.js';
import { fetchPhotos } from './modules/photoService.js';
import * as photoFetcher from './services/photoFetcher.js';
import { resolveAccountId } from './modules/accounts.js';
import * as accounts from './modules/accounts.js';


// --- API Routes ---

// Root
app.get('/', (_req, res) => {
  res.type('text').send('PixelFree backend is running. Try /api/photos');
});

// Auth
app.get('/api/login', (_req, res) => {
  console.log('[API] GET /api/login');
  const loginUrl = auth.getLoginUrl();
  res.json({ loginUrl });
});

app.get('/api/callback', async (req, res) => {
  console.log('[API] GET /api/callback' /*, req.query */);
  try {
    await auth.handleCallback(req.query);   // exchanges code + saves .token.json
    // Redirect somewhere useful: home or a small success page
    res.redirect('/');                      // or res.redirect('/api/auth/status')
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Callback failed', detail: String(e) });
  }
});

app.get('/api/auth/status', (_req, res) => {
  console.log('[API] GET /api/auth/status');
  res.json(auth.getStatus());
});

app.post('/api/auth/logout', (_req, res) => {
  console.log('[API] POST /api/auth/logout');
  auth.logout();
  res.json({ ok: true });
});

// Photos
app.get('/api/photos', async (req, res) => {
  console.log('[API] GET /api/photos', req.query);

  try {
    const cfg = settings.getSettings();
    let source = cfg.source; // default (e.g., tag)
    let limit  = Math.min(Number(req.query.limit) || (cfg.sync?.fetchLimit ?? 20), 40);

    const type = String(req.query.type || '');

    if (type === 'tag' && typeof req.query.tag === 'string') {
      source = { type: 'tag', tag: req.query.tag.trim() };
    } else if (type === 'public') {
      source = { type: 'public', localOnly: String(req.query.localOnly) === 'true' };
    } else if (type === 'user') {
      let accountId = req.query.accountId && String(req.query.accountId).trim();
      const acct = req.query.acct && String(req.query.acct).trim();

      if (!accountId) {
        if (!acct) {
          return res.status(400).json({ error: 'For type=user, provide accountId or acct.' });
        }
        accountId = await resolveAccountId(acct); // may throw → caught below
      }

      source = { type: 'user', accountId };
    }

    const photos = await fetchPhotos({ limit, source });
    res.json(photos);
  } catch (e) {
    console.error(e);
    const msg = String(e.message || e);
    const status = msg.startsWith('Unable to resolve acct') ? 400 : 500;
      // Yuck! Don't depend on error message text!
    res.status(status).json({ error: 'Failed to fetch photos', detail: msg });
  }
});

// Cache
app.get('/api/cache/clear', async (_req, res) => {
  console.log('[API] GET /api/cache/clear');
  await cache.clearCache();
  res.json({ status: 'Cache cleared' });
});

// Settings
app.get('/api/settings', (_req, res) => {
  console.log('[API] GET /api/settings');
  res.json(settings.getSettings());
});

app.post('/api/settings', (req, res) => {
  console.log('[API] POST /api/settings', req.body);
  settings.updateSettings(req.body || {});
  res.json({ status: 'Settings updated' });
});

// Health
app.get('/api/health', async (_req, res) => {
  const health = await (await import('./modules/health.js')).getHealth();
  res.json(health);
});



// Advanced multi-source query (tags/users with OR + AND)
app.post('/api/photos/query', async (req, res) => {
  try {
    const body = req.body || {};
    const limit = Math.min(Math.max(Number(body.limit)||20, 1), 40);

    if (body.type === 'tag') {
      const tags = Array.from(new Set((body.tags||[]).map(s => String(s).replace(/^#/, '').trim()).filter(Boolean)));
      if (!tags.length) return res.status(400).json({ error: 'tags required' });
      const photos = await photoFetcher.getLatestPhotosForTags(tags, { limit });
      return res.json(photos);
    }

    if (body.type === 'user') {
      const providedIds = Array.isArray(body.accountIds) ? body.accountIds : [];
      const accts = Array.isArray(body.accts) ? body.accts : [];
      const ids = Array.from(new Set([
        ...providedIds,
        ...await accounts.resolveManyAccts(accts)
      ].filter(Boolean)));
      if (!ids.length) return res.status(400).json({ error: 'users required' });
      const photos = await photoFetcher.getLatestPhotosForUsers(ids, { limit });
      return res.json(photos);
    }

    if (body.type === 'compound') {
      const tags = Array.from(new Set((body.tags||[]).map(s => String(s).replace(/^#/, '').trim()).filter(Boolean)));
      const userAccts = (body.users && Array.isArray(body.users.accts)) ? body.users.accts : [];
      const userIdsIn = (body.users && Array.isArray(body.users.accountIds)) ? body.users.accountIds : [];
      const accountIds = Array.from(new Set([
        ...userIdsIn,
        ...await accounts.resolveManyAccts(userAccts)
      ].filter(Boolean)));
      if (!tags.length && !accountIds.length) {
        return res.status(400).json({ error: 'tags or users required' });
      }
      const photos = await photoFetcher.getLatestPhotosCompound({ tags, accountIds }, { limit });
      return res.json(photos);
    }

    return res.status(400).json({ error: 'unsupported query type' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'query failed', detail: String(e?.message || e) });
  }
});
// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ PixelFree backend listening at http://localhost:${PORT}`);
  console.log(`   Try http://localhost:${PORT}/`);
});
