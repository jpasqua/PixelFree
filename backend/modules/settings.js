// PixelFree/backend/modules/settings.js
// Loads basic settings and allows minimal updates (in-memory for now).

let settings = {
  instanceUrl: process.env.PIXELFED_INSTANCE || 'https://pixelfed.social',
  clientId: process.env.PIXELFED_CLIENT_ID || 'FAKE_ID',
  clientSecret: process.env.PIXELFED_CLIENT_SECRET || 'FAKE_SECRET',
  redirectUri: process.env.PIXELFED_REDIRECT_URI || 'http://localhost:3000/api/callback',
  display: { transitionMs: 5000, showCaptions: true },
  source: { type: 'tag', tag: 'vacation' },
  sync: { intervalMs: 300000, fetchLimit: 20, cacheBudgetBytes: 500 * 1024 * 1024 }
};

export function getSettings() {
  return settings;
}

export function updateSettings(partial) {
  settings = { ...settings, ...partial };
  return settings;
}
