// Health endpoints and diagnostics
import { stats as cacheStats } from '../cache/cacheManager.js';

let lastSyncAt;

/** Mark last successful sync time */
export function markSynced() {
  // TODO: set lastSyncAt = now
  throw new Error('Not implemented');
}

/** @returns {Promise<{ ok:boolean, uptimeSec:number, lastSyncAt?:number, cache?:{items:number, bytes:number} }>} */
export async function getHealth() {
  // TODO: compute process.uptime(), get cache stats, return health object
  throw new Error('Not implemented');
}
