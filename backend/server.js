/**
 * server.js
 *
 * Main entry point for the OtterConnect backend server.
 *
 * This module is responsible for initializing and starting the Express.js
 * application, configuring global middleware, routing, and error handling.
 * It also establishes the connection to the underlying MySQL database and
 * ensures that application-wide configuration values are applied at startup.
 *
 * Key responsibilities:
 * - Load and configure environment variables to manage deployment settings
 *   (e.g., database credentials, ports, API keys).
 * - Initialize the Express app, apply JSON/body parsers, CORS settings, and
 *   any other middleware required globally across routes.
 * - Import and mount API route modules, providing a clean separation of
 *   functionality (e.g., authentication, user management, or application-specific
 *   features).
 * - Centralize error handling by using the error mapper utility to translate
 *   low-level errors (database, validation, etc.) into consistent HTTP responses.
 * - Start the HTTP server on the designated port and log a startup message to
 *   confirm the backend is online.
 *
 * In short, this file wires together the components defined in the rest of
 * the backend codebase and is the process entry point when launching the
 * application with Node.js.
 */

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
// TL;DR — Small frontend to test the backend. Not for production!

app.use(express.static('public'));

// --- Import modules ---
import * as auth from './modules/auth.js';
import * as photoService from './modules/photoService.js';
import * as cache from './modules/cache.js';
import * as settings from './modules/settings.js';
import { fetchPhotos } from './modules/photoService.js';
import * as photoFetcher from './services/photoFetcher.js';
import { resolveAccountId } from './modules/accounts.js';
import * as accounts from './modules/accounts.js';

// NEW: error handling helpers + typed errors
import { asyncHandler, errorMapper } from './utils/errorMapper.js';
import { ValidationError } from './modules/errors.js';

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

app.get('/api/callback', asyncHandler(async (req, res) => {
  console.log('[API] GET /api/callback' /*, req.query */);
  await auth.handleCallback(req.query);   // exchanges code + saves .token.json
  // Redirect somewhere useful: home or a small success page
  res.redirect('/');                      // or res.redirect('/api/auth/status')
}));

app.get('/api/auth/status', (_req, res) => {
  console.log('[API] GET /api/auth/status');
  res.json(auth.getStatus());
});

app.post('/api/auth/logout', (_req, res) => {
  console.log('[API] POST /api/auth/logout');
  auth.logout();
  res.json({ ok: true });
});

// Photos (legacy/simple)
app.get('/api/photos', asyncHandler(async (req, res) => {
  console.log('[API] GET /api/photos', req.query);

  const cfg = settings.getSettings();
  let source = cfg.source; // default (e.g., tag)
  const limit = Math.min(Number(req.query.limit) || (cfg.sync?.fetchLimit ?? 20), 40);
  const type = String(req.query.type || '').trim();

  if (type === 'tag' && typeof req.query.tag === 'string') {
    source = { type: 'tag', tag: req.query.tag.trim() };
  } else if (type === 'public') {
    source = { type: 'public', localOnly: String(req.query.localOnly) === 'true' };
  } else if (type === 'user') {
    let accountId = req.query.accountId && String(req.query.accountId).trim();
    const acct = req.query.acct && String(req.query.acct).trim();

    if (!accountId) {
      if (!acct) {
        throw new ValidationError('For type=user, provide accountId or acct.');
      }
      // resolveAccountId now throws typed errors which bubble to errorMapper
      accountId = await resolveAccountId(acct);
    }
    source = { type: 'user', accountId };
  }

  const photos = await fetchPhotos({ limit, source });
  res.json(photos);
}));

// Cache
app.get('/api/cache/clear', asyncHandler(async (_req, res) => {
  console.log('[API] GET /api/cache/clear');
  await cache.clearCache();
  res.json({ status: 'Cache cleared' });
}));

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
app.get('/api/health', asyncHandler(async (_req, res) => {
  const health = await (await import('./modules/health.js')).getHealth();
  res.json(health);
}));

// Advanced multi-source query (tags/users with OR + AND + tagMode any|all)
app.post('/api/photos/query', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const limitRaw = Number(body.limit);
  const limit = Math.max(1, Math.min(Number.isFinite(limitRaw) ? limitRaw : 20, 40));

  // ---- TAGS ONLY ----
  if (body.type === 'tag') {
    const tags = Array.from(new Set((body.tags || [])
      .map(s => String(s).replace(/^#/, '').trim())
      .filter(Boolean)));
    if (!tags.length) throw new ValidationError('tags required');

    const tagMode = String(body.tagMode || 'any').toLowerCase(); // 'any' | 'all'
    const photos = await photoFetcher.getLatestPhotosForTags(tags, { limit, tagMode });
    return res.json(photos);
  }

  // ---- USERS ONLY ----
  if (body.type === 'user') {
    const providedIds = Array.isArray(body.accountIds) ? body.accountIds : [];
    const accts = Array.isArray(body.accts) ? body.accts : [];
    const errors = [];
    const ids = providedIds.slice();

    for (const a of accts) {
      try {
        const id = await resolveAccountId(a);
        if (id) ids.push(id);
      } catch (e) {
        errors.push({ target: a, code: e.code || 'error', message: e.message });
      }
    }

    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!uniqueIds.length) throw new ValidationError('users required');

    const photos = await photoFetcher.getLatestPhotosForUsers(uniqueIds, { limit });
    return errors.length ? res.json({ photos, errors }) : res.json(photos);
  }

  // ---- COMPOUND (tags + users) ----
  if (body.type === 'compound') {
    const tags = Array.from(new Set((body.tags || [])
      .map(s => String(s).replace(/^#/, '').trim())
      .filter(Boolean)));

    // Users can come as acct strings or as accountIds
    const userAccts = Array.isArray(body.users?.accts) ? body.users.accts : [];
    const userIdsIn = Array.isArray(body.users?.accountIds) ? body.users.accountIds : [];

    const errors = [];
    const ids = userIdsIn.slice();

    // Resolve accts → ids with partial error collection
    for (const a of userAccts) {
      try {
        const id = await resolveAccountId(a);
        if (id) ids.push(id);
      } catch (e) {
        errors.push({ target: a, code: e.code || 'error', message: e.message });
      }
    }

    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (!tags.length && !uniqueIds.length) {
      throw new ValidationError('tags or users required');
    }

    const tagMode = String(body.tagMode || 'any').toLowerCase(); // 'any' | 'all'
    const photos = await photoFetcher.getLatestPhotosCompound(
      { tags, accountIds: uniqueIds },
      { limit, tagMode }
    );
    return errors.length ? res.json({ photos, errors }) : res.json(photos);
  }

  throw new ValidationError('unsupported query type', { type: body.type });
}));


// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ PixelFree backend listening at http://localhost:${PORT}`);
  console.log(`   Navigate to http://localhost:${PORT}/`);
});

// Final error mapper (must be after all routes/middleware)
app.use(errorMapper);