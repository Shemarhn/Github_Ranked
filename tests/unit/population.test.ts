import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateRank } from '@/lib/ranking/engine';
import {
  calculatePopulationRank,
  rankAgainstPopulation,
  POPULATION_MAX_AGE_MS,
  UPDATE_POPULATION,
} from '@/lib/ranking/population';

const { evaluate, getRedis } = vi.hoisted(() => ({
  evaluate: vi.fn(),
  getRedis: vi.fn(),
}));
vi.mock('@/lib/cache/redis', () => ({ getRedisClient: getRedis }));
const stats = {
  totalCommits: 100,
  totalMergedPRs: 10,
  totalCodeReviews: 5,
  totalIssuesClosed: 2,
  totalStars: 0,
  totalFollowers: 0,
  firstContributionYear: 2026,
  lastContributionYear: 2026,
  yearsActive: 1,
};

describe('Cached profile population', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRedis.mockReturnValue({ eval: evaluate });
    evaluate.mockResolvedValue([40, 100]);
  });
  it('places ranks using measured percentiles instead of the assumed score curve', () => {
    const rank = calculateRank(stats);
    expect(rankAgainstPopulation(rank, 40, 100)).toMatchObject({
      tier: 'Gold',
      percentile: 40,
      populationSize: 100,
      elo: 1200,
    });
    expect(rankAgainstPopulation(rank, 999, 1000)).toMatchObject({
      tier: 'Challenger',
      percentile: 99.9,
      elo: 3000,
    });
    expect(rankAgainstPopulation(rank, 0, 1)).toMatchObject({
      tier: 'Iron',
      division: 'IV',
      percentile: 0,
    });
  });
  it('assigns ties the same lower-bound percentile and does not promote across boundaries', () => {
    const rank = calculateRank(stats);
    expect(rankAgainstPopulation(rank, 0, 100).percentile).toBe(0);
    expect(rankAgainstPopulation(rank, 39999, 100000).tier).toBe('Silver');
    expect(rankAgainstPopulation(rank, 99, 100).tier).toBe('Grandmaster');
  });
  it('uses one atomic population update, normalizes case, and keeps seasons separate', async () => {
    const now = Date.now();
    expect(
      await calculatePopulationRank('OctoCat', stats, 2024, now)
    ).toMatchObject({ percentile: 40, populationSize: 100 });
    expect(evaluate).toHaveBeenCalledWith(
      UPDATE_POPULATION,
      ['population:v4:2024', 'population:v4:2024:observed'],
      ['octocat', calculateRank(stats).wpi, now, expect.any(Number)]
    );
    const args = evaluate.mock.calls[0][2];
    expect(args[3]).toBeGreaterThanOrEqual(now - POPULATION_MAX_AGE_MS);
    await calculatePopulationRank('octocat', stats);
    expect(evaluate.mock.calls[1][1][0]).toBe('population:v4:all');
  });
  it('retains the observation timestamp on cache hits and identity across renames', async () => {
    const observed = Date.now() - 3600_000;
    await calculatePopulationRank(
      'renamed',
      { ...stats, userId: 'U_123' },
      'all',
      observed
    );
    expect(evaluate.mock.calls[0][2][0]).toBe('U_123');
    expect(evaluate.mock.calls[0][2][2]).toBe(observed);
  });
  it('keeps a game rank during Redis outages without claiming a measured percentile', async () => {
    getRedis.mockReturnValueOnce(null);
    expect(await calculatePopulationRank('someone', stats)).toMatchObject({
      populationSize: 0,
      tier: calculateRank(stats).tier,
    });
    evaluate.mockRejectedValueOnce(new Error('offline'));
    expect(await calculatePopulationRank('someone', stats)).toMatchObject({
      populationSize: 0,
    });
  });
  it('does not accept malformed population results', () => {
    const rank = calculateRank(stats);
    expect(rankAgainstPopulation(rank, 2, 1)).toBe(rank);
    expect(rankAgainstPopulation(rank, NaN, 100)).toBe(rank);
    expect(rankAgainstPopulation(rank, 1.5, 100)).toBe(rank);
  });
});
