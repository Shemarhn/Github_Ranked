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

  /** League Points within current division (0 - 99) */
  lp: number;

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
  currentLP: number;
  nextDivisionElo: number;
  nextTierElo: number;
  progressToNextDivision: number; // 0-100
  progressToNextTier: number; // 0-100
}
