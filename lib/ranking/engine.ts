/**
 * Ranking Engine - Dev-Elo Calculation
 * Core algorithm for calculating developer skill ratings
 */

import type { AggregatedStats } from '@/lib/github/types';
import type { Tier, Division, RankResult } from './types';
import {
  METRIC_WEIGHTS,
  MAX_STARS_CAP,
  MEAN_LOG_SCORE,
  STD_DEV,
  BASE_ELO,
  ELO_PER_SIGMA,
  TIER_THRESHOLDS,
  TIERS_WITH_DIVISIONS,
  MAX_GP,
  MIN_GP,
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

/**
 * Get tier from Elo rating
 *
 * Maps an Elo rating to its corresponding tier based on defined thresholds.
 * Tier ranges follow League of Legends / Valorant ranking system.
 *
 * @param elo - Elo rating
 * @returns Tier (Iron through Challenger)
 *
 * @example
 * ```typescript
 * const elo = 1650;
 * const tier = getTier(elo); // Returns 'Platinum'
 * ```
 */
export function getTier(elo: number): Tier {
  // Iterate through tiers in reverse order (highest to lowest)
  // This ensures Challenger (3000+) is checked first
  const tiers: Tier[] = [
    'Challenger',
    'Grandmaster',
    'Master',
    'Diamond',
    'Emerald',
    'Platinum',
    'Gold',
    'Silver',
    'Bronze',
    'Iron',
  ];

  for (const tier of tiers) {
    const { min, max } = TIER_THRESHOLDS[tier];
    if (elo >= min && elo < max) {
      return tier;
    }
  }

  // Fallback to Iron for any Elo below 0 (shouldn't happen due to clamping)
  return 'Iron';
}

/**
 * Get division within a tier from Elo rating
 *
 * Divides a tier's Elo range into 4 divisions (IV, III, II, I).
 * Division I is the highest, Division IV is the lowest.
 * Master, Grandmaster, and Challenger tiers do not use divisions.
 *
 * @param elo - Elo rating
 * @param tier - Current tier
 * @returns Division (IV → I) or null for Master+
 *
 * @example
 * ```typescript
 * const elo = 1350;
 * const tier = getTier(elo); // 'Gold'
 * const division = getDivision(elo, tier); // 'II' (Gold II)
 * ```
 */
export function getDivision(elo: number, tier: Tier): Division | null {
  // Master, Grandmaster, and Challenger do not use divisions
  if (!TIERS_WITH_DIVISIONS.has(tier)) {
    return null;
  }

  const { min, max } = TIER_THRESHOLDS[tier];
  const range = max - min;
  const position = elo - min;

  // Each division occupies 1/4 of the tier range
  const divisionSize = range / 4;

  // Division IV: lowest quarter
  if (position < divisionSize) {
    return 'IV';
  }

  // Division III: second quarter
  if (position < divisionSize * 2) {
    return 'III';
  }

  // Division II: third quarter
  if (position < divisionSize * 3) {
    return 'II';
  }

  // Division I: highest quarter
  return 'I';
}

/**
 * Calculate Git Points (GP) within current division
 *
 * GP represents progress within a division, ranging from 0-99.
 * Returns 0 for tiers without divisions (Master, Grandmaster, Challenger).
 *
 * @param elo - Elo rating
 * @param tier - Current tier
 * @param division - Current division
 * @returns Git Points (0-99) or 0 for Master+
 *
 * @example
 * ```typescript
 * const elo = 1350;
 * const tier = getTier(elo); // 'Gold'
 * const division = getDivision(elo, tier); // 'II'
 * const gp = calculateGP(elo, tier, division); // 50 (halfway through Gold II)
 * ```
 */
export function calculateGP(elo: number, tier: Tier, division: Division | null): number {
  // Master, Grandmaster, and Challenger do not use GP
  if (division === null || !TIERS_WITH_DIVISIONS.has(tier)) {
    return 0;
  }

  const { min, max } = TIER_THRESHOLDS[tier];
  const tierRange = max - min;
  const divisionSize = tierRange / 4;

  // Calculate the minimum Elo for the current division
  const divisionIndex = { IV: 0, III: 1, II: 2, I: 3 }[division];
  const divisionMinElo = min + divisionIndex * divisionSize;
  const divisionMaxElo = min + (divisionIndex + 1) * divisionSize;

  // Calculate position within the division
  const positionInDivision = elo - divisionMinElo;

  // At the very end of a division (just before the next division/tier starts),
  // ensure we return MAX_GP (99)
  if (elo >= divisionMaxElo - 1) {
    return MAX_GP;
  }

  // Scale to 0-99 range
  const gp = (positionInDivision / divisionSize) * (MAX_GP + 1);

  // Clamp to valid range and floor to get integer
  const clampedGP = Math.max(MIN_GP, Math.min(MAX_GP, Math.floor(gp)));

  return clampedGP;
}

/**
 * Error function (erf) approximation
 *
 * Uses Abramowitz and Stegun approximation formula for the error function.
 * Accurate to ~1.5×10^-7 which is more than sufficient for percentile calculations.
 *
 * @param x - Input value
 * @returns Error function value erf(x)
 *
 * @internal
 */
function erf(x: number): number {
  // Constants for approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign of x
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Calculate percentile from Z-score
 *
 * Converts a Z-score to a percentile using the cumulative distribution function (CDF)
 * of the standard normal distribution. Returns a value from 0 to 100 representing
 * the percentage of developers with a lower score.
 *
 * @param zScore - Z-score (standard deviations from mean)
 * @returns Percentile (0-100)
 *
 * @example
 * ```typescript
 * const zScore = 0; // Mean
 * const percentile = calculatePercentile(zScore); // ~50 (median)
 * ```
 *
 * @example
 * ```typescript
 * const zScore = 2; // 2 standard deviations above mean
 * const percentile = calculatePercentile(zScore); // ~97.7 (top 2.3%)
 * ```
 */
export function calculatePercentile(zScore: number): number {
  // Standard normal CDF: Φ(z) = 0.5 * (1 + erf(z / √2))
  const cdf = 0.5 * (1 + erf(zScore / Math.sqrt(2)));

  // Convert to percentile (0-100)
  const percentile = cdf * 100;

  // Clamp to valid range (handle floating point edge cases)
  const clampedPercentile = Math.max(0, Math.min(100, percentile));

  // Round to 1 decimal place for cleaner UI display
  return Math.round(clampedPercentile * 10) / 10;
}

/**
 * Calculate complete rank for a user
 *
 * Main orchestration function that calculates all ranking metrics from
 * aggregated GitHub statistics. This is the primary entry point for the
 * ranking system.
 *
 * @param stats - Aggregated GitHub statistics
 * @returns Complete rank result with all metrics
 * @throws {Error} If stats are invalid or calculation fails
 *
 * @example
 * ```typescript
 * const stats = {
 *   totalMergedPRs: 50,
 *   totalCodeReviews: 30,
 *   totalIssuesClosed: 20,
 *   totalCommits: 100,
 *   totalStars: 250,
 *   totalFollowers: 10,
 *   firstContributionYear: 2020,
 *   lastContributionYear: 2024,
 *   yearsActive: 5,
 * };
 *
 * const rank = calculateRank(stats);
 * // {
 * //   tier: 'Gold',
 * //   division: 'II',
 * //   elo: 1350,
 * //   gp: 50,
 * //   percentile: 65.5,
 * //   wpi: 5550,
 * //   zScore: 0.375
 * // }
 * ```
 */
export function calculateRank(stats: AggregatedStats): RankResult {
  // Validate input
  if (!stats || typeof stats !== 'object') {
    throw new Error('Invalid stats: must be an AggregatedStats object');
  }

  // Step 1: Calculate Weighted Performance Index (WPI)
  const wpi = calculateWPI(stats);

  // Step 2: Transform WPI to Z-score using log-normal distribution
  const zScore = calculateZScore(wpi);

  // Step 3: Convert Z-score to Elo rating
  const elo = calculateElo(zScore);

  // Step 4: Determine tier from Elo
  const tier = getTier(elo);

  // Step 5: Determine division within tier (if applicable)
  const division = getDivision(elo, tier);

  // Step 6: Calculate Git Points within division (if applicable)
  const gp = calculateGP(elo, tier, division);

  // Step 7: Calculate percentile ranking
  const percentile = calculatePercentile(zScore);

  // Return complete rank result
  return {
    tier,
    division,
    elo,
    gp,
    percentile,
    wpi,
    zScore,
  };
}
