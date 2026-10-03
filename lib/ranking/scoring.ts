import type { AggregatedStats } from '../github/types';
import { METRIC_WEIGHTS, MAX_STARS_CAP } from './constants';

/** Game balance parameters, not estimates of engineering skill. */
export const SOFT_LIMITS = {
  mergedPRs: 50,
  codeReviews: 50,
  issuesClosed: 30,
  commits: 200,
  stars: 100,
} as const;

export function diminishing(value: number, scale: number): number {
  const count = Number.isFinite(value) ? Math.max(0, value) : 0;
  return scale * Math.log1p(count / scale);
}

export function scoreBreakdown(stats: AggregatedStats) {
  const counts = {
    mergedPRs: stats.totalMergedPRs,
    codeReviews: stats.totalCodeReviews,
    issuesClosed: stats.totalIssuesClosed,
    commits: Math.min(stats.totalCommits, 10_000),
    stars: Math.min(stats.totalStars, MAX_STARS_CAP),
  };
  return Object.fromEntries(
    Object.entries(counts).map(([key, value]) => {
      const metric = key as keyof typeof counts;
      return [
        metric,
        Math.round(
          diminishing(value, SOFT_LIMITS[metric]) * METRIC_WEIGHTS[metric] * 100
        ) / 100,
      ];
    })
  ) as Record<keyof typeof counts, number>;
}
