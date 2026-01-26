/**
 * Integration Tests for API Route Handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules before importing route handler
vi.mock('@/lib/github/aggregator', () => ({
  aggregateAllTimeStats: vi.fn(),
  fetchYearlyStats: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  getCachedRank: vi.fn(),
  setCachedRank: vi.fn(),
  getCacheHeaders: vi.fn().mockReturnValue({
    'Cache-Control': 'public, max-age=86400',
    'X-Cache': 'MISS',
    'X-Cache-TTL': '86400',
  }),
  CACHE_TTL: {
    DEFAULT: 86400,
    NOT_FOUND: 3600,
    ERROR: 300,
  },
}));

vi.mock('@/lib/renderer/render', () => ({
  renderRankCard: vi.fn().mockResolvedValue('<svg></svg>'),
}));

import { GET } from '@/app/api/rank/[username]/route';
import {
  aggregateAllTimeStats,
  fetchYearlyStats,
} from '@/lib/github/aggregator';
import { getCachedRank, setCachedRank } from '@/lib/cache';
import { renderRankCard } from '@/lib/renderer/render';
import { UserNotFoundError, RateLimitError } from '@/lib/utils/errors';
import type { AggregatedStats } from '@/lib/github/types';
import type { RankResult } from '@/lib/ranking/types';

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

const mockRank: RankResult = {
  elo: 1500,
  tier: 'Gold',
  division: 'II',
  gp: 50,
  percentile: 60,
  wpi: 5000,
  zScore: 0.5,
};

const createRequest = (url: string): NextRequest => {
  return new NextRequest(new URL(url, 'http://localhost'));
};

describe('API Route: GET /api/rank/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedRank).mockResolvedValue({
      hit: false,
      data: null,
      key: 'test',
    });
    vi.mocked(setCachedRank).mockResolvedValue(true);
    vi.mocked(aggregateAllTimeStats).mockResolvedValue(mockStats);
    vi.mocked(renderRankCard).mockResolvedValue('<svg>test</svg>');
  });

  describe('Successful Requests', () => {
    it('should return SVG for valid username', async () => {
      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/svg+xml');
      expect(aggregateAllTimeStats).toHaveBeenCalledWith('octocat');
    });

    it('should use cached data when available', async () => {
      vi.mocked(getCachedRank).mockResolvedValue({
        hit: true,
        data: {
          username: 'octocat',
          rank: mockRank,
          stats: mockStats,
          cachedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
        key: 'rank:octocat:all:default',
      });

      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(aggregateAllTimeStats).not.toHaveBeenCalled();
      expect(renderRankCard).toHaveBeenCalled();
    });

    it('should bypass cache when force=true', async () => {
      vi.mocked(getCachedRank).mockResolvedValue({
        hit: true,
        data: {
          username: 'octocat',
          rank: mockRank,
          stats: mockStats,
          cachedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        },
        key: 'rank:octocat:all:default',
      });

      const request = createRequest(
        'http://localhost/api/rank/octocat?force=true'
      );
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(aggregateAllTimeStats).toHaveBeenCalled();
    });

    it('should apply theme parameter', async () => {
      const request = createRequest(
        'http://localhost/api/rank/octocat?theme=dark'
      );
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(renderRankCard).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'dark' })
      );
    });

    it('should apply season parameter', async () => {
      vi.mocked(fetchYearlyStats).mockResolvedValue({
        year: 2024,
        commits: 50,
        prs: 25,
        reviews: 15,
        issues: 10,
        privateContributions: 5,
      });

      const request = createRequest(
        'http://localhost/api/rank/octocat?season=2024'
      );
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(fetchYearlyStats).toHaveBeenCalledWith('octocat', 2024);
      expect(aggregateAllTimeStats).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid username', async () => {
      const request = createRequest('http://localhost/api/rank/-invalid');
      const params = Promise.resolve({ username: '-invalid' });

      const response = await GET(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ValidationError');
    });

    it('should return 400 for invalid season', async () => {
      const request = createRequest(
        'http://localhost/api/rank/octocat?season=invalid'
      );
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('ValidationError');
    });

    it('should default to valid theme for invalid theme', async () => {
      const request = createRequest(
        'http://localhost/api/rank/octocat?theme=invalid'
      );
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(renderRankCard).toHaveBeenCalledWith(
        expect.objectContaining({ theme: 'default' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for user not found', async () => {
      vi.mocked(aggregateAllTimeStats).mockRejectedValue(
        new UserNotFoundError('nonexistent')
      );

      const request = createRequest('http://localhost/api/rank/nonexistent');
      const params = Promise.resolve({ username: 'nonexistent' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('UserNotFound');
    });

    it('should return 429 for rate limit', async () => {
      vi.mocked(aggregateAllTimeStats).mockRejectedValue(
        new RateLimitError('Rate limit exceeded', 60)
      );

      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(aggregateAllTimeStats).mockRejectedValue(
        new Error('Unexpected')
      );

      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('InternalError');
    });
  });

  describe('Response Headers', () => {
    it('should include request ID header', async () => {
      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.headers.get('X-Request-Id')).toBeTruthy();
    });

    it('should include response time header', async () => {
      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
    });

    it('should include cache headers', async () => {
      const request = createRequest('http://localhost/api/rank/octocat');
      const params = Promise.resolve({ username: 'octocat' });

      const response = await GET(request, { params });

      expect(response.headers.get('Cache-Control')).toBeDefined();
    });
  });
});
