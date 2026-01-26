/**
 * Cache Service
 * High-level caching operations for rank results
 */

import type { RankResult } from '../ranking/types';
import type { AggregatedStats } from '../github/types';
import {
  generateCacheKey,
  generateYearCacheKey,
  createCacheData,
  isCacheExpired,
  determineTTL,
  CACHE_TTL,
  type CachedRankData,
  type CacheGetOptions,
  type CacheSetOptions,
} from '../utils/cache';
import { redisGet, redisSet, isRedisConfigured } from './redis';

/**
 * Cached rank result with metadata
 */
export interface CacheResult {
  /** Whether the result was found in cache */
  hit: boolean;
  /** Cached data if found */
  data: CachedRankData | null;
  /** Cache key used */
  key: string;
}

/**
 * Get cached rank data for a user.
 *
 * @param username - GitHub username
 * @param options - Cache options (season, theme)
 * @returns Cache result with hit status and data
 */
export async function getCachedRank(
  username: string,
  options: CacheGetOptions = {}
): Promise<CacheResult> {
  const key = generateCacheKey(username, options);

  // If Redis is not configured, return cache miss
  if (!isRedisConfigured()) {
    return { hit: false, data: null, key };
  }

  try {
    // Try to get from Redis (Upstash returns parsed JSON directly)
    const cached = await redisGet<CachedRankData>(key);

    if (!cached) {
      return { hit: false, data: null, key };
    }

    // Validate the cached data structure
    // For Upstash, data is already parsed, so we need to validate directly
    if (
      !cached.username ||
      !cached.rank ||
      !cached.stats ||
      typeof cached.cachedAt !== 'number' ||
      typeof cached.expiresAt !== 'number'
    ) {
      return { hit: false, data: null, key };
    }

    // Check if expired (belt and suspenders - Redis TTL should handle this)
    if (isCacheExpired(cached)) {
      return { hit: false, data: null, key };
    }

    return { hit: true, data: cached, key };
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return { hit: false, data: null, key };
  }
}

/**
 * Set cached rank data for a user.
 *
 * @param username - GitHub username
 * @param rank - Calculated rank result
 * @param stats - Aggregated user stats
 * @param options - Cache options (ttl, season, theme)
 * @returns true if cached successfully, false otherwise
 */
export async function setCachedRank(
  username: string,
  rank: RankResult,
  stats: AggregatedStats,
  options: CacheSetOptions = {}
): Promise<boolean> {
  const { ttl = CACHE_TTL.DEFAULT, season, theme } = options;
  const key = generateCacheKey(username, { season, theme });

  // If Redis is not configured, return false
  if (!isRedisConfigured()) {
    return false;
  }

  try {
    const cacheData = createCacheData(username, rank, stats, ttl);
    const success = await redisSet(key, cacheData, ttl);
    return success;
  } catch (error) {
    console.error('[Cache] Set error:', error);
    return false;
  }
}

/**
 * Yearly stats cache data structure
 */
export interface YearlyStatsCacheData {
  year: number;
  stats: {
    commits: number;
    mergedPRs: number;
    codeReviews: number;
    issuesClosed: number;
  };
  cachedAt: number;
}

/**
 * Get cached yearly stats.
 *
 * @param username - GitHub username
 * @param year - Year to fetch
 * @returns Cached stats or null
 */
export async function getCachedYearlyStats(
  username: string,
  year: number
): Promise<YearlyStatsCacheData | null> {
  if (!isRedisConfigured()) {
    return null;
  }

  const key = generateYearCacheKey(username, year);

  try {
    const cached = await redisGet<YearlyStatsCacheData>(key);
    return cached;
  } catch (error) {
    console.error('[Cache] Get yearly stats error:', error);
    return null;
  }
}

/**
 * Set cached yearly stats.
 *
 * @param username - GitHub username
 * @param year - Year of the stats
 * @param stats - Stats to cache
 * @returns true if cached successfully
 */
export async function setCachedYearlyStats(
  username: string,
  year: number,
  stats: YearlyStatsCacheData['stats']
): Promise<boolean> {
  if (!isRedisConfigured()) {
    return false;
  }

  const key = generateYearCacheKey(username, year);
  const ttl = determineTTL(year);

  const cacheData: YearlyStatsCacheData = {
    year,
    stats,
    cachedAt: Date.now(),
  };

  try {
    const success = await redisSet(key, cacheData, ttl);
    return success;
  } catch (error) {
    console.error('[Cache] Set yearly stats error:', error);
    return false;
  }
}

/**
 * Check if caching is available.
 *
 * @returns true if Redis is configured
 */
export function isCachingAvailable(): boolean {
  return isRedisConfigured();
}

/**
 * Generate cache control headers.
 *
 * @param maxAge - Max age in seconds
 * @param isPublic - Whether cache is public
 * @returns Cache-Control header value
 */
export function getCacheControlHeader(
  maxAge: number = CACHE_TTL.DEFAULT,
  isPublic: boolean = true
): string {
  const visibility = isPublic ? 'public' : 'private';
  return `${visibility}, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`;
}

/**
 * Generate headers for cached response.
 *
 * @param cacheHit - Whether response was from cache
 * @param ttl - TTL for cache headers
 * @returns Headers object
 */
export function getCacheHeaders(
  cacheHit: boolean,
  ttl: number = CACHE_TTL.DEFAULT
): Record<string, string> {
  return {
    'Cache-Control': getCacheControlHeader(ttl),
    'X-Cache': cacheHit ? 'HIT' : 'MISS',
    'X-Cache-TTL': String(ttl),
  };
}
