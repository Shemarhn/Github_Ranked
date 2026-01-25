import { describe, expect, it } from 'vitest';

import {
  aggregateAllTimeStats,
  fetchContributionYears,
  fetchYearlyStats,
} from '@/lib/github/aggregator';

const token = process.env.GITHUB_TOKEN_1;
const describeIf = token ? describe : describe.skip;

describeIf('GitHub aggregator integration', () => {
  it('fetches contribution years for a real user', async () => {
    const years = await fetchContributionYears('octocat', token);

    expect(Array.isArray(years)).toBe(true);
  });

  it('fetches yearly stats for the current year', async () => {
    const currentYear = new Date().getUTCFullYear();
    const stats = await fetchYearlyStats('octocat', currentYear, token);

    expect(stats.year).toBe(currentYear);
    expect(stats.commits).toBeGreaterThanOrEqual(0);
  });

  it('aggregates all-time stats for a real user', async () => {
    const stats = await aggregateAllTimeStats('octocat', token);

    expect(stats.totalCommits).toBeGreaterThanOrEqual(0);
    expect(stats.totalStars).toBeGreaterThanOrEqual(0);
  });
});
