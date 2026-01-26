/**
 * Cache Utilities
 * Redis caching with Upstash for rank results
 */

import type { RankResult } from '../ranking/types';
import type { AggregatedStats } from '../github/types';

/**
 * TTL Constants (in seconds)
 */
export const CACHE_TTL = {
  /** Default TTL for rank results (24 hours) */
  DEFAULT: 24 * 60 * 60,
  /** TTL for current year stats (1 hour) */
  CURRENT_YEAR: 60 * 60,
  /** TTL for historical years (30 days - effectively permanent) */
  HISTORICAL_YEAR: 30 * 24 * 60 * 60,
  /** TTL for user not found responses (1 hour) */
  NOT_FOUND: 60 * 60,
  /** TTL for error responses (5 minutes) */
  ERROR: 5 * 60,
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  RANK: 'rank',
  YEAR_STATS: 'year',
  USER: 'user',
} as const;

/**
 * Cached rank data structure
 */
export interface CachedRankData {
  username: string;
  rank: RankResult;
  stats: AggregatedStats;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Cache options for set operations
 */
export interface CacheSetOptions {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Season for the rank (defaults to 'all') */
  season?: number | 'all';
  /** Theme for the card (defaults to 'default') */
  theme?: string;
}

/**
 * Cache get options
 */
export interface CacheGetOptions {
  /** Season for the rank */
  season?: number | 'all';
  /** Theme for the card */
  theme?: string;
}

/**
 * Generate a cache key for a rank request.
 * Format: rank:{username}:{season}:{theme}
 *
 * @param username - GitHub username (case-insensitive, will be lowercased)
 * @param options - Optional season and theme
 * @returns Cache key string
 *
 * @example
 * generateCacheKey('octocat') // 'rank:octocat:all:default'
 * generateCacheKey('octocat', { season: 2024 }) // 'rank:octocat:2024:default'
 * generateCacheKey('octocat', { season: 2024, theme: 'dark' }) // 'rank:octocat:2024:dark'
 */
export function generateCacheKey(
  username: string,
  options: CacheGetOptions = {}
): string {
  const { season = 'all', theme = 'default' } = options;
  const normalizedUsername = username.toLowerCase().trim();
  return `${CACHE_PREFIX.RANK}:${normalizedUsername}:${season}:${theme}`;
}

/**
 * Generate a cache key for yearly stats.
 * Format: year:{username}:{year}
 *
 * @param username - GitHub username
 * @param year - Year for the stats
 * @returns Cache key string
 */
export function generateYearCacheKey(username: string, year: number): string {
  const normalizedUsername = username.toLowerCase().trim();
  return `${CACHE_PREFIX.YEAR_STATS}:${normalizedUsername}:${year}`;
}

/**
 * Serialize cached rank data for storage.
 *
 * @param data - Rank data to serialize
 * @returns JSON string
 */
export function serializeCacheData(data: CachedRankData): string {
  return JSON.stringify(data);
}

/**
 * Deserialize cached rank data from storage.
 *
 * @param data - JSON string to parse
 * @returns Parsed CachedRankData or null if invalid
 */
export function deserializeCacheData(data: string): CachedRankData | null {
  try {
    const parsed = JSON.parse(data) as CachedRankData;

    // Validate required fields exist
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed.username ||
      !parsed.rank ||
      !parsed.stats ||
      typeof parsed.cachedAt !== 'number' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if cached data is expired.
 *
 * @param data - Cached rank data
 * @returns true if expired, false otherwise
 */
export function isCacheExpired(data: CachedRankData): boolean {
  return Date.now() > data.expiresAt;
}

/**
 * Create cached rank data with expiration.
 *
 * @param username - GitHub username
 * @param rank - Calculated rank result
 * @param stats - Aggregated user stats
 * @param ttl - Time-to-live in seconds (defaults to DEFAULT)
 * @returns CachedRankData ready for storage
 */
export function createCacheData(
  username: string,
  rank: RankResult,
  stats: AggregatedStats,
  ttl: number = CACHE_TTL.DEFAULT
): CachedRankData {
  const now = Date.now();
  return {
    username,
    rank,
    stats,
    cachedAt: now,
    expiresAt: now + ttl * 1000,
  };
}

/**
 * Calculate remaining TTL for cached data.
 *
 * @param data - Cached rank data
 * @returns Remaining seconds, or 0 if expired
 */
export function getRemainingTTL(data: CachedRankData): number {
  const remaining = Math.floor((data.expiresAt - Date.now()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Determine appropriate TTL based on data type.
 *
 * @param year - Year of the data, or undefined for all-time
 * @param currentYear - Current year (defaults to Date.now year)
 * @returns TTL in seconds
 */
export function determineTTL(
  year?: number,
  currentYear: number = new Date().getUTCFullYear()
): number {
  if (year === undefined) {
    // All-time stats
    return CACHE_TTL.DEFAULT;
  }

  if (year < currentYear) {
    // Historical year - data won't change
    return CACHE_TTL.HISTORICAL_YEAR;
  }

  // Current year - more frequent updates
  return CACHE_TTL.CURRENT_YEAR;
}
