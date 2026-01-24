import { describe, expect, it } from 'vitest';

import { isAggregatedStats } from '../../lib/github/types';
import { isDivision, isTier } from '../../lib/ranking/types';

describe('type guards', () => {
  it('validates tiers and divisions', () => {
    expect(isTier('Gold')).toBe(true);
    expect(isTier('Challenger')).toBe(true);
    expect(isTier('Unknown')).toBe(false);

    expect(isDivision('IV')).toBe(true);
    expect(isDivision('I')).toBe(true);
    expect(isDivision('V')).toBe(false);
  });

  it('validates AggregatedStats shape', () => {
    const stats = {
      totalCommits: 100,
      totalMergedPRs: 20,
      totalCodeReviews: 10,
      totalIssuesClosed: 5,
      totalStars: 50,
      totalFollowers: 12,
      firstContributionYear: 2019,
      lastContributionYear: 2024,
      yearsActive: 6,
    };

    expect(isAggregatedStats(stats)).toBe(true);
    expect(isAggregatedStats({ ...stats, totalCommits: '100' })).toBe(false);
    expect(isAggregatedStats(null)).toBe(false);
  });
});
