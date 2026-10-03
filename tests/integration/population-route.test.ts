import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/population/route';

const mocks = vi.hoisted(() => ({
  set: vi.fn(),
  eval: vi.fn(),
  discover: vi.fn(),
  aggregate: vi.fn(),
  rank: vi.fn(),
  cache: vi.fn(),
}));
vi.mock('@/lib/cache/redis', () => ({
  getRedisClient: () => ({ set: mocks.set, eval: mocks.eval }),
}));
vi.mock('@/lib/cache', () => ({ setCachedRank: mocks.cache }));
vi.mock('@/lib/github/sampling', () => ({ discoverSample: mocks.discover }));
vi.mock('@/lib/github/aggregator', () => ({
  aggregateAllTimeStatsExtended: mocks.aggregate,
}));
vi.mock('@/lib/ranking/population', () => ({
  calculatePopulationRank: mocks.rank,
}));

const request = (secret = 'fixture-secret') =>
  new NextRequest('https://example.test/api/population', {
    headers: { authorization: `Bearer ${secret}` },
  });

describe('Population sampling endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'fixture-secret');
    vi.stubEnv('GITHUB_TOKEN_1', 'fixture-token');
    mocks.set.mockResolvedValue('OK');
    mocks.eval.mockResolvedValue(1);
    mocks.discover.mockResolvedValue(['inactive']);
    mocks.aggregate.mockResolvedValue({
      userId: 'U1',
      totalCommits: 0,
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalStars: 0,
      totalFollowers: 0,
      yearlyBreakdown: [],
      decayedYearlyBreakdown: [],
    });
    mocks.rank.mockResolvedValue({ tier: 'Iron', populationSize: 1 });
    mocks.cache.mockResolvedValue(true);
  });
  afterEach(() => vi.unstubAllEnvs());
  it('rejects absent/incorrect secrets before discovery or storage', async () => {
    expect((await GET(request('wrong'))).status).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(request(''))).status).toBe(401);
    expect(mocks.discover).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it('skips overlapping runs without deleting another lock', async () => {
    mocks.set.mockResolvedValue(null);
    expect(await (await GET(request())).json()).toEqual({
      skipped: 'Sampling is already running',
    });
    expect(mocks.discover).not.toHaveBeenCalled();
    expect(mocks.eval).not.toHaveBeenCalled();
  });
  it('caches inactive accounts in both all-time and current-season populations', async () => {
    const result = await GET(request());
    expect(await result.json()).toEqual({ sampled: 1, cached: 1 });
    expect(mocks.rank).toHaveBeenCalledTimes(2);
    expect(mocks.rank.mock.calls[1][1]).toMatchObject({
      totalStars: 0,
      totalCommits: 0,
    });
    expect(mocks.rank.mock.calls[1][2]).toBe(new Date().getUTCFullYear());
    expect(mocks.cache).toHaveBeenCalledTimes(2);
    expect(mocks.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('GET'"),
      ['population:v4:sampling-lock'],
      [expect.any(String)]
    );
    expect(result.headers.get('cache-control')).toBe('no-store');
  });
  it('reports failed storage and releases its lock', async () => {
    mocks.cache.mockResolvedValue(false);
    expect((await GET(request())).status).toBe(502);
    expect(mocks.eval).toHaveBeenCalledTimes(1);
  });
  it('does not convert GitHub failures into fake zero-score population entries', async () => {
    mocks.aggregate.mockRejectedValue(new Error('401'));
    expect((await GET(request())).status).toBe(502);
    expect(mocks.rank).not.toHaveBeenCalled();
    expect(mocks.cache).not.toHaveBeenCalled();
  });
});
