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
 * Higher weights = more valuable signal of developer skill
 */
export const METRIC_WEIGHTS = {
  /** Merged Pull Requests - highest value (peer acceptance, collaboration) */
  mergedPRs: 40,

  /** Code Reviews - high value (seniority signal, mentorship) */
  codeReviews: 30,

  /** Issues Closed - medium value (problem-solving) */
  issuesClosed: 20,

  /** Commits - low value (prevents commit farming) */
  commits: 10,

  /** Stars - lowest value, capped at 500 (social proof, viral distortion prevention) */
  stars: 5,
} as const;

/**
 * Maximum star count that contributes to ranking
 * Prevents viral repositories from distorting the ranking
 */
export const MAX_STARS_CAP = 500;

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
 * Maximum LP value within a division (alias for GP)
 */
export const MAX_LP = MAX_GP;

/**
 * Minimum GP value
 */
export const MIN_GP = 0;

/**
 * Minimum LP value (alias for GP)
 */
export const MIN_LP = MIN_GP;
