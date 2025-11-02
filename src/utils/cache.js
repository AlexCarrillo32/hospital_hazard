import { createLogger } from './logger.js';

const logger = createLogger('cache');

/**
 * Simple in-memory cache with TTL support
 */
class Cache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTtl = options.defaultTtl || 3600000; // 1 hour default
    this.maxSize = options.maxSize || 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      logger.debug({ key }, 'Cache miss');
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug({ key }, 'Cache expired');
      return null;
    }

    this.stats.hits++;
    logger.debug({ key, ttl: entry.expiresAt - Date.now() }, 'Cache hit');
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = null) {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }

    const expiresAt = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, { value, expiresAt, createdAt: Date.now() });
    this.stats.sets++;

    logger.debug({ key, ttl: ttl || this.defaultTtl }, 'Cache set');
  }

  /**
   * Delete key from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug({ key }, 'Cache delete');
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    const value = this.get(key);
    return value !== null;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info({ clearedItems: size }, 'Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
    };
  }

  /**
   * Evict oldest entry
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      logger.debug({ key: oldestKey }, 'Cache eviction');
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, 'Cache cleanup completed');
    }

    return cleaned;
  }
}

// Global cache instances
export const facilityCache = new Cache({ defaultTtl: 1800000, maxSize: 500 }); // 30 min
export const wasteCodeCache = new Cache({ defaultTtl: 3600000, maxSize: 200 }); // 1 hour
export const routeCache = new Cache({ defaultTtl: 600000, maxSize: 100 }); // 10 min

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  facilityCache.cleanup();
  wasteCodeCache.cleanup();
  routeCache.cleanup();
}, 300000);

export default Cache;
