// PixelFree/backend/modules/health.js
import { stats as cacheStats } from './cache.js';

export async function getHealth() {
  const uptimeSec = Math.floor(process.uptime());
  const cache = await cacheStats();
  return { ok: true, uptimeSec, cache };
}
