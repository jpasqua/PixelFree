// Cache manager: download/store images locally and maintain metadata
// JSDoc typedefs are in ../types.js

/**
 * @param {Photo} p
 * @returns {Promise<CachedPhoto>}
 */
export async function ensureCached(p) {
  // TODO:
  // - check if file already exists on disk (by photo id or URL hash)
  // - if not, download to assets/ and record localPath, etag if available
  // - return CachedPhoto with lastFetchedAt = now
  throw new Error('Not implemented');
}

/**
 * @param {string} id
 * @returns {Promise<CachedPhoto | null>}
 */
export async function getCachedById(id) {
  // TODO: lookup from metadata index, return if present
  throw new Error('Not implemented');
}

/**
 * @param {number} maxBytes
 */
export async function purgeLRU(maxBytes) {
  // TODO: compute total cache size; evict least-recently-used until under budget
  throw new Error('Not implemented');
}

export async function stats() {
  // TODO: return cache item count and disk usage
  throw new Error('Not implemented');
}
