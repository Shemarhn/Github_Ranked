/**
 * Unit Tests for Cache Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCachedRank,
  setCachedRank,
  getCachedYearlyStats,
  setCachedYearlyStats,
  isCachingAvailable,
  getCacheControlHeader,
  getCacheHeaders,
} from '@/lib/cache/service';
import { CACHE_TTL } from '@/lib/utils/cache';
import type { RankResult } from '@/lib/ranking/types';
import type { AggregatedStats } from '@/lib/github/types';

// Mock redis module
vi.mock('@/lib/cache/redis', () => ({
  isRedisConfigured: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}));

import { isRedisConfigured, redisGet, redisSet } from '@/lib/cache/redis';

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

describe('Cache Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCachedRank', () => {
    it('should return cache miss when Redis not configured', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
      expect(result.key).toBe('rank:octocat:all:default');
    });

    it('should return cache miss when key not found', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(null);

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
      expect(redisGet).toHaveBeenCalledWith('rank:octocat:all:default');
    });

    it('should return cache hit with valid data', async () => {
      const cachedData = {
        username: 'octocat',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      };

      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(cachedData);

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(true);
      expect(result.data).toEqual(cachedData);
    });

    it('should return cache miss for expired data', async () => {
      const expiredData = {
        username: 'octocat',
        rank: mockRank,
        stats: mockStats,
        cachedAt: Date.now() - 100000,
        expiresAt: Date.now() - 50000, // Expired
      };

      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(expiredData);

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should return cache miss for invalid data structure', async () => {
      const invalidData = {
        username: 'octocat',
        // Missing rank, stats, cachedAt, expiresAt
      };

      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(invalidData);

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should use season and theme in cache key', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(null);

      await getCachedRank('octocat', { season: 2024, theme: 'dark' });

      expect(redisGet).toHaveBeenCalledWith('rank:octocat:2024:dark');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockRejectedValue(new Error('Connection failed'));

      const result = await getCachedRank('octocat');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('setCachedRank', () => {
    it('should return false when Redis not configured', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);

      const result = await setCachedRank('octocat', mockRank, mockStats);

      expect(result).toBe(false);
      expect(redisSet).not.toHaveBeenCalled();
    });

    it('should set cache with default TTL', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisSet).mockResolvedValue(true);

      const result = await setCachedRank('octocat', mockRank, mockStats);

      expect(result).toBe(true);
      expect(redisSet).toHaveBeenCalledWith(
        'rank:octocat:all:default',
        expect.objectContaining({
          username: 'octocat',
          rank: mockRank,
          stats: mockStats,
        }),
        CACHE_TTL.DEFAULT
      );
    });

    it('should set cache with custom TTL', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisSet).mockResolvedValue(true);

      const customTTL = 3600;
      await setCachedRank('octocat', mockRank, mockStats, { ttl: customTTL });

      expect(redisSet).toHaveBeenCalledWith(
        'rank:octocat:all:default',
        expect.anything(),
        customTTL
      );
    });

    it('should use season and theme in cache key', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisSet).mockResolvedValue(true);

      await setCachedRank('octocat', mockRank, mockStats, {
        season: 2024,
        theme: 'dark',
      });

      expect(redisSet).toHaveBeenCalledWith(
        'rank:octocat:2024:dark',
        expect.anything(),
        expect.any(Number)
      );
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisSet).mockRejectedValue(new Error('Connection failed'));

      const result = await setCachedRank('octocat', mockRank, mockStats);

      expect(result).toBe(false);
    });
  });

  describe('getCachedYearlyStats', () => {
    it('should return null when Redis not configured', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);

      const result = await getCachedYearlyStats('octocat', 2024);

      expect(result).toBeNull();
    });

    it('should return cached yearly stats', async () => {
      const cachedStats = {
        year: 2024,
        stats: {
          commits: 100,
          mergedPRs: 50,
          codeReviews: 30,
          issuesClosed: 20,
        },
        cachedAt: Date.now(),
      };

      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisGet).mockResolvedValue(cachedStats);

      const result = await getCachedYearlyStats('octocat', 2024);

      expect(result).toEqual(cachedStats);
      expect(redisGet).toHaveBeenCalledWith('year:octocat:2024');
    });
  });

  describe('setCachedYearlyStats', () => {
    it('should return false when Redis not configured', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);

      const result = await setCachedYearlyStats('octocat', 2024, {
        commits: 100,
        mergedPRs: 50,
        codeReviews: 30,
        issuesClosed: 20,
      });

      expect(result).toBe(false);
    });

    it('should set yearly stats with appropriate TTL', async () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      vi.mocked(redisSet).mockResolvedValue(true);

      const stats = {
        commits: 100,
        mergedPRs: 50,
        codeReviews: 30,
        issuesClosed: 20,
      };

      const result = await setCachedYearlyStats('octocat', 2023, stats);

      expect(result).toBe(true);
      expect(redisSet).toHaveBeenCalledWith(
        'year:octocat:2023',
        expect.objectContaining({ year: 2023, stats }),
        CACHE_TTL.HISTORICAL_YEAR
      );
    });
  });

  describe('isCachingAvailable', () => {
    it('should return true when Redis is configured', () => {
      vi.mocked(isRedisConfigured).mockReturnValue(true);
      expect(isCachingAvailable()).toBe(true);
    });

    it('should return false when Redis is not configured', () => {
      vi.mocked(isRedisConfigured).mockReturnValue(false);
      expect(isCachingAvailable()).toBe(false);
    });
  });

  describe('getCacheControlHeader', () => {
    it('should return public cache header with default TTL', () => {
      const header = getCacheControlHeader();
      expect(header).toContain('public');
      expect(header).toContain(`max-age=${CACHE_TTL.DEFAULT}`);
      expect(header).toContain('stale-while-revalidate');
    });

    it('should return header with custom TTL', () => {
      const header = getCacheControlHeader(3600);
      expect(header).toContain('max-age=3600');
      expect(header).toContain('s-maxage=3600');
    });

    it('should return private header when specified', () => {
      const header = getCacheControlHeader(3600, false);
      expect(header).toContain('private');
      expect(header).not.toContain('public');
    });
  });

  describe('getCacheHeaders', () => {
    it('should return HIT header for cache hit', () => {
      const headers = getCacheHeaders(true);
      expect(headers['X-Cache']).toBe('HIT');
    });

    it('should return MISS header for cache miss', () => {
      const headers = getCacheHeaders(false);
      expect(headers['X-Cache']).toBe('MISS');
    });

    it('should include Cache-Control header', () => {
      const headers = getCacheHeaders(true);
      expect(headers['Cache-Control']).toBeDefined();
    });

    it('should include TTL header', () => {
      const headers = getCacheHeaders(true, 3600);
      expect(headers['X-Cache-TTL']).toBe('3600');
    });
  });
});
