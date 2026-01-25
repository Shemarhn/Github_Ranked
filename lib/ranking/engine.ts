/**
 * Ranking Engine - Dev-Elo Calculation
 * Core algorithm for calculating developer skill ratings
 */

import type { AggregatedStats } from '@/lib/github/types';
import { METRIC_WEIGHTS, MAX_STARS_CAP } from './constants';

/**
 * Calculate Weighted Performance Index (WPI)
 *
 * WPI is a weighted sum of contribution metrics that represents
 * a developer's overall activity and impact.
 *
 * @param stats - Aggregated GitHub statistics
 * @returns Weighted Performance Index (minimum 1 to avoid log(0))
 *
 * @example
 * ```typescript
 * const stats = {
 *   totalMergedPRs: 50,
 *   totalCodeReviews: 30,
 *   totalIssuesClosed: 20,
 *   totalCommits: 100,
 *   totalStars: 250,
 *   // ... other fields
 * };
 * const wpi = calculateWPI(stats); // 2000 + 900 + 400 + 1000 + 1250 = 5550
 * ```
 */
export function calculateWPI(stats: AggregatedStats): number {
  // Cap stars at 500 to prevent viral repositories from distorting rankings
  const cappedStars = Math.min(stats.totalStars, MAX_STARS_CAP);

  const wpi =
    stats.totalMergedPRs * METRIC_WEIGHTS.mergedPRs +
    stats.totalCodeReviews * METRIC_WEIGHTS.codeReviews +
    stats.totalIssuesClosed * METRIC_WEIGHTS.issuesClosed +
    stats.totalCommits * METRIC_WEIGHTS.commits +
    cappedStars * METRIC_WEIGHTS.stars;

  // Ensure minimum WPI of 1 to avoid log(0) in subsequent calculations
  return Math.max(wpi, 1);
}
