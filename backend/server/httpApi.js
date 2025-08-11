// Express server that exposes backend endpoints (stub)
import express from 'express';

export function createServer() {
  const app = express();

  // TODO: add routes:
  // GET /login                 -> redirect to authorize URL
  // GET /oauth/callback        -> handle code exchange
  // GET /api/auth/status       -> basic auth status
  // POST /api/auth/logout      -> clear token

  // GET /api/photos            -> proxy to services/photoFetcher
  // GET /api/photos/cached     -> return queue from syncScheduler

  // GET /api/config            -> load settings
  // POST /api/config           -> update prefs

  // GET /api/health            -> health summary

  return app;
}
