/**
 * Ranking Algorithm Constants
 * Contains all constants used in the Dev-Elo ranking system
 */

import type { Tier } from './types';

// ============================================================================
// Algorithm Constants
// ============================================================================

/**
 * Mean of log-transformed global developer activity
 * Derived from GitClear research on global GitHub activity distribution
 */
export const MEAN_LOG_SCORE = 6.5;

/**
 * Standard deviation of log-transformed scores
 */
export const STD_DEV = 1.5;

/**
 * Base Elo rating - represents median developer (Gold IV)
 */
export const BASE_ELO = 1200;

/**
 * Elo points per standard deviation
 */
export const ELO_PER_SIGMA = 400;

// ============================================================================
// Metric Weights
// ============================================================================

/**
 * Weights for calculating Weighted Performance Index (WPI)
 * Normalized to 100% total - higher weights = more valuable signal
 *
 * v2.0 weights prioritize collaboration (PRs + Reviews = 54%)
 * while giving stars meaningful impact (15%) capped at 10k
 */
export const METRIC_WEIGHTS = {
  /** Merged Pull Requests - peer acceptance, collaboration */
  mergedPRs: 27,

  /** Code Reviews - seniority signal, mentorship */
  codeReviews: 27,

  /** Issues Closed - problem-solving */
  issuesClosed: 18,

  /** Stars - open source impact (capped at 10k) */
  stars: 15,

  /** Commits - activity indicator (moderate to prevent farming) */
  commits: 13,
} as const;

/**
 * Maximum star count that contributes to ranking
 * Increased to 10,000 to better recognize open source impact
 * while still preventing extreme viral distortion
 */
export const MAX_STARS_CAP = 10_000;

// ============================================================================
// Tier Thresholds
// ============================================================================

/**
 * Elo ranges for each tier
 * Format: [minElo, maxElo (exclusive)]
 */
export const TIER_THRESHOLDS: Record<Tier, { min: number; max: number }> = {
  Iron: { min: 0, max: 600 },
  Bronze: { min: 600, max: 900 },
  Silver: { min: 900, max: 1200 },
  Gold: { min: 1200, max: 1500 },
  Platinum: { min: 1500, max: 1700 },
  Emerald: { min: 1700, max: 2000 },
  Diamond: { min: 2000, max: 2400 },
  Master: { min: 2400, max: 2600 },
  Grandmaster: { min: 2600, max: 3000 },
  Challenger: { min: 3000, max: Infinity },
} as const;

/**
 * Tiers that use divisions (IV, III, II, I)
 * Master, Grandmaster, and Challenger do not use divisions
 */
export const TIERS_WITH_DIVISIONS: ReadonlySet<Tier> = new Set([
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Emerald',
  'Diamond',
]);

// ============================================================================
// Tier Colors
// ============================================================================

/**
 * Color schemes for each tier
 * Gradient format: [start color, end color]
 */
export const TIER_COLORS: Record<
  Tier,
  { primary: [string, string]; accent: string }
> = {
  Iron: {
    primary: ['#3a3a3a', '#1a1a1a'],
    accent: '#5c5c5c',
  },
  Bronze: {
    primary: ['#8B4513', '#CD7F32'],
    accent: '#D4A574',
  },
  Silver: {
    primary: ['#C0C0C0', '#A8A8A8'],
    accent: '#E8E8E8',
  },
  Gold: {
    primary: ['#FFD700', '#FDB931'],
    accent: '#FFF4B8',
  },
  Platinum: {
    primary: ['#00CED1', '#20B2AA'],
    accent: '#7FFFD4',
  },
  Emerald: {
    primary: ['#50C878', '#2E8B57'],
    accent: '#98FB98',
  },
  Diamond: {
    primary: ['#B9F2FF', '#00D4FF'],
    accent: '#E0FFFF',
  },
  Master: {
    primary: ['#9932CC', '#8B008B'],
    accent: '#DA70D6',
  },
  Grandmaster: {
    primary: ['#DC143C', '#8B0000'],
    accent: '#FF6B6B',
  },
  Challenger: {
    primary: ['#FFD700', '#FF8C00'], // Gold + rainbow (animated in renderer)
    accent: '#FFF700',
  },
} as const;

// ============================================================================
// Git Points (GP)
// ============================================================================

/**
 * Maximum GP value within a division
 */
export const MAX_GP = 99;

/**
 * Minimum GP value
 */
export const MIN_GP = 0;

// ============================================================================
// Seasonal Decay (League of Legends-style soft reset)
// ============================================================================

/**
 * Decay multipliers for previous seasons
 * Implements a soft reset where older contributions have less impact
 * Similar to competitive game ranking systems
 */
export const SEASONAL_DECAY = {
  /** Current season gets full weight */
  CURRENT_SEASON: 1.0,
  /** Previous season (e.g., 2025 when current is 2026) */
  PREVIOUS_SEASON: 0.6,
  /** Two seasons ago */
  TWO_SEASONS_AGO: 0.35,
  /** Three seasons ago */
  THREE_SEASONS_AGO: 0.2,
  /** Four or more seasons ago - minimal legacy weight */
  LEGACY: 0.1,
} as const;

/**
 * Calculate decay multiplier for a given year
 * @param year - The contribution year
 * @param currentYear - Current year (defaults to UTC year)
 * @returns Decay multiplier (0.1 - 1.0)
 */
export function getSeasonalDecayMultiplier(
  year: number,
  currentYear: number = new Date().getUTCFullYear()
): number {
  const yearsAgo = currentYear - year;

  if (yearsAgo <= 0) return SEASONAL_DECAY.CURRENT_SEASON;
  if (yearsAgo === 1) return SEASONAL_DECAY.PREVIOUS_SEASON;
  if (yearsAgo === 2) return SEASONAL_DECAY.TWO_SEASONS_AGO;
  if (yearsAgo === 3) return SEASONAL_DECAY.THREE_SEASONS_AGO;
  return SEASONAL_DECAY.LEGACY;
}
