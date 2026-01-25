/**
 * Ranking Engine - Dev-Elo Calculation
 * Core algorithm for calculating developer skill ratings
 */

import type { AggregatedStats } from '@/lib/github/types';
import {
  METRIC_WEIGHTS,
  MAX_STARS_CAP,
  MEAN_LOG_SCORE,
  STD_DEV,
  BASE_ELO,
  ELO_PER_SIGMA,
} from './constants';

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

/**
 * Calculate Z-Score from Weighted Performance Index
 *
 * Applies log-normal transformation to WPI and calculates standard deviations
 * from the global mean. This normalizes the exponential distribution of
 * developer activity into a standard normal distribution.
 *
 * @param wpi - Weighted Performance Index
 * @returns Z-score (standard deviations from mean)
 *
 * @example
 * ```typescript
 * const wpi = 5000;
 * const zScore = calculateZScore(wpi);
 * // log(5000) ≈ 8.517, (8.517 - 6.5) / 1.5 ≈ 1.34
 * ```
 */
export function calculateZScore(wpi: number): number {
  // Apply log transformation to normalize exponential distribution
  const logScore = Math.log(wpi);

  // Calculate standard deviations from global mean
  const zScore = (logScore - MEAN_LOG_SCORE) / STD_DEV;

  return zScore;
}

/**
 * Calculate Elo rating from Z-score
 *
 * Converts Z-score into an Elo rating using the formula:
 * Elo = BASE_ELO + (Z-Score × ELO_PER_SIGMA)
 *
 * Where BASE_ELO (1200) represents the median developer (Gold IV)
 * and each standard deviation equals 400 Elo points.
 *
 * @param zScore - Z-score (standard deviations from mean)
 * @returns Elo rating (minimum 0, no upper limit)
 *
 * @example
 * ```typescript
 * const zScore = 1.5; // 1.5 standard deviations above mean
 * const elo = calculateElo(zScore);
 * // 1200 + (1.5 × 400) = 1800 (Emerald tier)
 * ```
 */
export function calculateElo(zScore: number): number {
  // Convert Z-score to Elo rating
  const elo = BASE_ELO + zScore * ELO_PER_SIGMA;

  // Round to nearest integer
  const roundedElo = Math.round(elo);

  // Clamp to minimum of 0 (no upper limit - Challenger can exceed 3000)
  return Math.max(roundedElo, 0);
}
