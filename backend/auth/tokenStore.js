// Token store: persist and retrieve tokens (disk for now)

import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.resolve('.token.json'); // TODO: allow override

/**
 * @returns {TokenSet | null}
 */
export function get() {
  // TODO: read file if exists, JSON.parse, return TokenSet
  throw new Error('Not implemented');
}

/**
 * @param {TokenSet} tokens
 */
export function set(tokens) {
  // TODO: write file with 0600 perms; include created_at if missing
  throw new Error('Not implemented');
}

export function clear() {
  // TODO: delete token file if present
  throw new Error('Not implemented');
}

/**
 * @param {TokenSet} tokens
 * @param {number} [skewSeconds]
 */
export function isExpired(tokens, skewSeconds = 60) {
  // TODO: compute created_at + expires_in <= now + skewSeconds
  throw new Error('Not implemented');
}
