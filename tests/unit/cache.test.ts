/**
 * Unit Tests for Cache Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from '@/lib/utils/cache';
import type { RankResult } from '@/lib/ranking/types';
import type { AggregatedStats } from '@/lib/github/types';

const mockRank: RankResult = {
  elo: 1500,
  tier: 'Gold',
  division: 'II',
  gp: 50,
  percentile: 60,
  wpi: 5000,
  zScore: 0.5,
};

const mockStats: AggregatedStats = {
  totalMergedPRs: 50,
  totalCodeReviews: 30,
  totalIssuesClosed: 20,
  totalCommits: 100,
  totalStars: 250,
  totalFollowers: 10,
  firstContributionYear: 2020,
  lastContributionYear: 2024,
  yearsActive: 5,
};

describe('Cache Key Generation', () => {
  describe('generateCacheKey', () => {
    it('should generate key with default options', () => {
      const key = generateCacheKey('octocat');
      expect(key).toBe('rank:octocat:all:default');
    });

    it('should normalize username to lowercase', () => {
      const key = generateCacheKey('OctoCat');
      expect(key).toBe('rank:octocat:all:default');
    });

    it('should trim whitespace from username', () => {
      const key = generateCacheKey('  octocat  ');
      expect(key).toBe('rank:octocat:all:default');
    });

    it('should include season when provided', () => {
      const key = generateCacheKey('octocat', { season: 2024 });
      expect(key).toBe('rank:octocat:2024:default');
    });

    it('should include theme when provided', () => {
      const key = generateCacheKey('octocat', { theme: 'dark' });
      expect(key).toBe('rank:octocat:all:dark');
    });

    it('should include both season and theme', () => {
      const key = generateCacheKey('octocat', { season: 2024, theme: 'dark' });
      expect(key).toBe('rank:octocat:2024:dark');
    });

    it('should handle season as "all"', () => {
      const key = generateCacheKey('octocat', { season: 'all' });
      expect(key).toBe('rank:octocat:all:default');
    });

    it('should use correct prefix', () => {
      const key = generateCacheKey('test');
      expect(key.startsWith(CACHE_PREFIX.RANK)).toBe(true);
    });
  });

  describe('generateYearCacheKey', () => {
    it('should generate key for year stats', () => {
      const key = generateYearCacheKey('octocat', 2024);
      expect(key).toBe('year:octocat:2024');
    });

    it('should normalize username to lowercase', () => {
      const key = generateYearCacheKey('OctoCat', 2024);
      expect(key).toBe('year:octocat:2024');
    });

    it('should use correct prefix', () => {
      const key = generateYearCacheKey('test', 2024);
      expect(key.startsWith(CACHE_PREFIX.YEAR_STATS)).toBe(true);
    });
  });
});

describe('Cache Data Serialization', () => {
  const now = Date.now();
  const testData: CachedRankData = {
    username: 'octocat',
    rank: mockRank,
    stats: mockStats,
    cachedAt: now,
    expiresAt: now + CACHE_TTL.DEFAULT * 1000,
  };

  describe('serializeCacheData', () => {
    it('should serialize data to JSON string', () => {
      const serialized = serializeCacheData(testData);
      expect(typeof serialized).toBe('string');
      expect(JSON.parse(serialized)).toEqual(testData);
    });

    it('should handle all data types correctly', () => {
      const serialized = serializeCacheData(testData);
      const parsed = JSON.parse(serialized);
      expect(parsed.username).toBe('octocat');
      expect(parsed.rank.elo).toBe(1500);
      expect(parsed.stats.totalMergedPRs).toBe(50);
    });
  });

  describe('deserializeCacheData', () => {
    it('should deserialize valid JSON to CachedRankData', () => {
      const serialized = JSON.stringify(testData);
      const result = deserializeCacheData(serialized);
      expect(result).toEqual(testData);
    });

    it('should return null for invalid JSON', () => {
      const result = deserializeCacheData('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for missing username', () => {
      const invalid = { ...testData, username: undefined };
      const serialized = JSON.stringify(invalid);
      const result = deserializeCacheData(serialized);
      expect(result).toBeNull();
    });

    it('should return null for missing rank', () => {
      const invalid = { ...testData, rank: undefined };
      const serialized = JSON.stringify(invalid);
      const result = deserializeCacheData(serialized);
      expect(result).toBeNull();
    });

    it('should return null for missing stats', () => {
      const invalid = { ...testData, stats: undefined };
      const serialized = JSON.stringify(invalid);
      const result = deserializeCacheData(serialized);
      expect(result).toBeNull();
    });

    it('should return null for invalid cachedAt', () => {
      const invalid = { ...testData, cachedAt: 'not a number' };
      const serialized = JSON.stringify(invalid);
      const result = deserializeCacheData(serialized);
      expect(result).toBeNull();
    });

    it('should return null for invalid expiresAt', () => {
      const invalid = { ...testData, expiresAt: 'not a number' };
      const serialized = JSON.stringify(invalid);
      const result = deserializeCacheData(serialized);
      expect(result).toBeNull();
    });

    it('should return null for non-object data', () => {
      const result = deserializeCacheData('"string"');
      expect(result).toBeNull();
    });

    it('should return null for null data', () => {
      const result = deserializeCacheData('null');
      expect(result).toBeNull();
    });
  });
});

describe('Cache Expiration', () => {
  describe('isCacheExpired', () => {
    it('should return false for non-expired data', () => {
      const data: CachedRankData = {
        username: 'test',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 60000, // 1 minute in future
      };
      expect(isCacheExpired(data)).toBe(false);
    });

    it('should return true for expired data', () => {
      const data: CachedRankData = {
        username: 'test',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now() - 120000,
        expiresAt: Date.now() - 60000, // 1 minute in past
      };
      expect(isCacheExpired(data)).toBe(true);
    });

    it('should return true for data expiring exactly now', () => {
      const now = Date.now();
      const data: CachedRankData = {
        username: 'test',
        rank: mockRank,
        stats: mockStats,
        cachedAt: now - 60000,
        expiresAt: now - 1, // Just past
      };
      expect(isCacheExpired(data)).toBe(true);
    });
  });

  describe('getRemainingTTL', () => {
    it('should return remaining seconds for non-expired data', () => {
      const data: CachedRankData = {
        username: 'test',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 60000, // 60 seconds
      };
      const remaining = getRemainingTTL(data);
      expect(remaining).toBeGreaterThan(55);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('should return 0 for expired data', () => {
      const data: CachedRankData = {
        username: 'test',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now() - 120000,
        expiresAt: Date.now() - 60000,
      };
      expect(getRemainingTTL(data)).toBe(0);
    });
  });
});

describe('Cache Data Creation', () => {
  describe('createCacheData', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create cache data with default TTL', () => {
      const data = createCacheData('octocat', mockRank, mockStats);

      expect(data.username).toBe('octocat');
      expect(data.rank).toEqual(mockRank);
      expect(data.stats).toEqual(mockStats);
      expect(data.cachedAt).toBe(Date.now());
      expect(data.expiresAt).toBe(Date.now() + CACHE_TTL.DEFAULT * 1000);
    });

    it('should create cache data with custom TTL', () => {
      const customTTL = 3600; // 1 hour
      const data = createCacheData('octocat', mockRank, mockStats, customTTL);

      expect(data.expiresAt).toBe(Date.now() + customTTL * 1000);
    });

    it('should use current timestamp for cachedAt', () => {
      const before = Date.now();
      const data = createCacheData('octocat', mockRank, mockStats);
      const after = Date.now();

      expect(data.cachedAt).toBeGreaterThanOrEqual(before);
      expect(data.cachedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('determineTTL', () => {
    it('should return DEFAULT TTL for undefined year', () => {
      expect(determineTTL()).toBe(CACHE_TTL.DEFAULT);
      expect(determineTTL(undefined)).toBe(CACHE_TTL.DEFAULT);
    });

    it('should return HISTORICAL_YEAR TTL for past years', () => {
      expect(determineTTL(2023, 2024)).toBe(CACHE_TTL.HISTORICAL_YEAR);
      expect(determineTTL(2020, 2024)).toBe(CACHE_TTL.HISTORICAL_YEAR);
    });

    it('should return CURRENT_YEAR TTL for current year', () => {
      expect(determineTTL(2024, 2024)).toBe(CACHE_TTL.CURRENT_YEAR);
    });

    it('should return CURRENT_YEAR TTL for future year', () => {
      expect(determineTTL(2025, 2024)).toBe(CACHE_TTL.CURRENT_YEAR);
    });

    it('should use current year if not provided', () => {
      const currentYear = new Date().getUTCFullYear();
      expect(determineTTL(currentYear)).toBe(CACHE_TTL.CURRENT_YEAR);
      expect(determineTTL(currentYear - 1)).toBe(CACHE_TTL.HISTORICAL_YEAR);
    });
  });
});

describe('Cache TTL Constants', () => {
  it('should have correct DEFAULT TTL (24 hours)', () => {
    expect(CACHE_TTL.DEFAULT).toBe(24 * 60 * 60);
  });

  it('should have correct CURRENT_YEAR TTL (1 hour)', () => {
    expect(CACHE_TTL.CURRENT_YEAR).toBe(60 * 60);
  });

  it('should have correct HISTORICAL_YEAR TTL (30 days)', () => {
    expect(CACHE_TTL.HISTORICAL_YEAR).toBe(30 * 24 * 60 * 60);
  });

  it('should have correct NOT_FOUND TTL (1 hour)', () => {
    expect(CACHE_TTL.NOT_FOUND).toBe(60 * 60);
  });

  it('should have correct ERROR TTL (5 minutes)', () => {
    expect(CACHE_TTL.ERROR).toBe(5 * 60);
  });
});

describe('Cache Prefix Constants', () => {
  it('should have RANK prefix', () => {
    expect(CACHE_PREFIX.RANK).toBe('rank');
  });

  it('should have YEAR_STATS prefix', () => {
    expect(CACHE_PREFIX.YEAR_STATS).toBe('year');
  });

  it('should have USER prefix', () => {
    expect(CACHE_PREFIX.USER).toBe('user');
  });
});
