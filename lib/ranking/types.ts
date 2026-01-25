/**
 * Ranking System Type Definitions
 * Types for the Dev-Elo ranking system and tier classifications
 */

// ============================================================================
// Tier and Division Types
// ============================================================================

/**
 * Ranking tiers from lowest to highest
 * Based on League of Legends / Valorant ranking system
 */
export type Tier =
  | 'Iron'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Emerald'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Challenger';

/**
 * Division within a tier
 * IV (lowest) → I (highest)
 * Master, Grandmaster, and Challenger do not use divisions
 */
export type Division = 'IV' | 'III' | 'II' | 'I';

/**
 * Ordered list of tier values for validation and UI usage.
 */
export const TIERS: readonly Tier[] = [
  'Iron',
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Emerald',
  'Diamond',
  'Master',
  'Grandmaster',
  'Challenger',
];

/**
 * Ordered list of division values (lowest to highest).
 */
export const DIVISIONS: readonly Division[] = ['IV', 'III', 'II', 'I'];

/**
 * Runtime type guard for `Tier`.
 */
export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && TIERS.includes(value as Tier);
}

/**
 * Runtime type guard for `Division`.
 */
export function isDivision(value: unknown): value is Division {
  return typeof value === 'string' && DIVISIONS.includes(value as Division);
}

// ============================================================================
// Rank Result Types
// ============================================================================

/**
 * Complete ranking result for a user
 * Contains all calculated ranking metrics
 */
export interface RankResult {
  /** Current tier (Iron → Challenger) */
  tier: Tier;

  /** Division within tier (IV → I), null for Master+ */
  division: Division | null;

  /** Elo rating (0 - 3500+) */
  elo: number;

  /** Git Points within current division (0 - 99) */
  gp: number;

  /** Percentile ranking (0 - 100) */
  percentile: number;

  /** Weighted Performance Index - raw score before transformation */
  wpi: number;

  /** Z-score - standard deviations from global mean */
  zScore: number;
}

/**
 * Tier information including Elo range
 */
export interface TierInfo {
  name: Tier;
  minElo: number;
  maxElo: number;
  hasDivisions: boolean;
}

/**
 * Progress information for UI display
 */
export interface RankProgress {
  currentElo: number;
  currentGP: number;
  nextDivisionElo: number;
  nextTierElo: number;
  progressToNextDivision: number; // 0-100
  progressToNextTier: number; // 0-100
}
