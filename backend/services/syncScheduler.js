// Scheduler: periodically fetch new photos, cache them, and update display queue
// JSDoc typedefs are in ../types.js
import { getLatestPhotos } from './photoFetcher.js';
import { ensureCached, purgeLRU } from '../cache/cacheManager.js';

/**
 * @typedef {Object} SyncConfig
 * @property {Source} source
 * @property {number} fetchLimit
 * @property {number} intervalMs
 * @property {number} cacheBudgetBytes
 */

let intervalHandle = null;
/** @type {CachedPhoto[]} */
let queue = [];
const listeners = new Set();

/**
 * @param {SyncConfig} cfg
 */
export function start(cfg) {
  // TODO: kick an immediate sync(), then setInterval
  // update queue and notify listeners on success
  throw new Error('Not implemented');
}

export function stop() {
  // TODO: clearInterval if set
  throw new Error('Not implemented');
}

/** @returns {CachedPhoto[]} */
export function getQueue() {
  // TODO: return a copy of newest-first queue
  throw new Error('Not implemented');
}

/**
 * @param {'updated'} event
 * @param {() => void} cb
 */
export function on(event, cb) {
  // TODO: only 'updated' supported for now
  // add to listeners set; return unsubscribe helper if desired
  throw new Error('Not implemented');
}
