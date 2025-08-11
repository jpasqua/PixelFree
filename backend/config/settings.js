// Settings loader/saver
// JSDoc typedefs are in ../types.js
import fs from 'fs';
import path from 'path';

const USER_PREFS_PATH = path.resolve('pixelfree.prefs.json');

/** @returns {AppSettings} */
export function load() {
  // TODO:
  // - Read env vars for instanceUrl, clientId, clientSecret, redirectUri
  // - Read a user prefs JSON (if present) for display/source/sync
  // - Validate and return merged settings
  throw new Error('Not implemented');
}

/**
 * @param {Partial<AppSettings['display'] | AppSettings['source'] | AppSettings['sync']>} partial
 */
export function saveUserPrefs(partial) {
  // TODO: merge and persist back to JSON file
  throw new Error('Not implemented');
}
