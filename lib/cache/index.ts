/**
 * Cache Module Exports
 */

// Core utilities
export {
  generateCacheKey,
  generateYearCacheKey,
  serializeCacheData,
  deserializeCacheData,
  isCacheExpired,
  createCacheData,
  getRemainingTTL,
  determineTTL,
  CACHE_TTL,
  CACHE_PREFIX,
  type CachedRankData,
  type CacheSetOptions,
  type CacheGetOptions,
} from '../utils/cache';

// Redis client
export {
  getRedisClient,
  resetRedisClient,
  isRedisConfigured,
  redisGet,
  redisSet,
  redisDel,
  redisExists,
  redisTTL,
  redisPing,
} from './redis';

// Cache service
export {
  getCachedRank,
  setCachedRank,
  getCachedYearlyStats,
  setCachedYearlyStats,
  isCachingAvailable,
  getCacheControlHeader,
  getCacheHeaders,
  type CacheResult,
  type YearlyStatsCacheData,
} from './service';
