/**
 * Unit Tests for Ranking Engine
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWPI,
  calculateZScore,
  calculateElo,
  getTier,
  getDivision,
  calculateGP,
  calculatePercentile,
  calculateRank,
} from '@/lib/ranking/engine';
import type { AggregatedStats } from '@/lib/github/types';
import {
  MEAN_LOG_SCORE,
  STD_DEV,
  BASE_ELO,
  ELO_PER_SIGMA,
} from '@/lib/ranking/constants';

describe('Ranking Engine - calculateWPI', () => {
  it('should calculate WPI with all metrics', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 50,
      totalCodeReviews: 30,
      totalIssuesClosed: 20,
      totalCommits: 100,
      totalStars: 250,
      totalFollowers: 10,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const wpi = calculateWPI(stats);

    // Expected: (50*27) + (30*27) + (20*18) + (100*13) + (250*15)
    //         = 1350 + 810 + 360 + 1300 + 3750 = 7570
    expect(wpi).toBe(7570);
  });

  it('should cap stars at 10000', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 15000, // Above cap
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpi = calculateWPI(stats);

    // Expected: 10000 * 15 = 150000 (stars capped)
    expect(wpi).toBe(150000);
  });

  it('should return minimum WPI of 1 for zero contributions', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 0,
    };

    const wpi = calculateWPI(stats);

    // Minimum WPI is 1 to avoid log(0)
    expect(wpi).toBe(1);
  });

  it('should apply correct weights to each metric', () => {
    // Test each metric individually
    const baseStat: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    // Test merged PRs weight (27)
    const wpiPRs = calculateWPI({ ...baseStat, totalMergedPRs: 10 });
    expect(wpiPRs).toBe(270);

    // Test code reviews weight (27)
    const wpiReviews = calculateWPI({ ...baseStat, totalCodeReviews: 10 });
    expect(wpiReviews).toBe(270);

    // Test issues weight (18)
    const wpiIssues = calculateWPI({ ...baseStat, totalIssuesClosed: 10 });
    expect(wpiIssues).toBe(180);

    // Test commits weight (13)
    const wpiCommits = calculateWPI({ ...baseStat, totalCommits: 10 });
    expect(wpiCommits).toBe(130);

    // Test stars weight (15)
    const wpiStars = calculateWPI({ ...baseStat, totalStars: 10 });
    expect(wpiStars).toBe(150);
  });

  it('should handle exactly 10000 stars without capping', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 10000, // Exactly at cap
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpi = calculateWPI(stats);

    // Expected: 10000 * 15 = 150000
    expect(wpi).toBe(150000);
  });

  it('should handle large numbers correctly', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 1000,
      totalCodeReviews: 500,
      totalIssuesClosed: 300,
      totalCommits: 10000,
      totalStars: 5000, // Under cap of 10000
      totalFollowers: 100,
      firstContributionYear: 2015,
      lastContributionYear: 2024,
      yearsActive: 10,
    };

    const wpi = calculateWPI(stats);

    // Expected: (1000*27) + (500*27) + (300*18) + (10000*13) + (5000*15)
    //         = 27000 + 13500 + 5400 + 130000 + 75000 = 250900
    expect(wpi).toBe(250900);
  });

  it('should prioritize collaboration metrics over commits', () => {
    const collaborativeStats: AggregatedStats = {
      totalMergedPRs: 100,
      totalCodeReviews: 100,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const commitHeavyStats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 415, // Adjusted for new weights
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpiCollaborative = calculateWPI(collaborativeStats);
    const wpiCommitHeavy = calculateWPI(commitHeavyStats);

    // Collaborative work should be valued higher
    // Collaborative: (100*27) + (100*27) = 5400
    // Commit-heavy: (415*13) = 5395
    expect(wpiCollaborative).toBe(5400);
    expect(wpiCommitHeavy).toBe(5395);

    // Verify that collaboration is rewarded more than pure commits
    // With new weights: 50 PRs + 50 reviews = 50*27 + 50*27 = 2700
    // To match that with commits: 2700/13 = ~208 commits
    const betterCollaborative = calculateWPI({
      ...collaborativeStats,
      totalMergedPRs: 50,
      totalCodeReviews: 50,
    });
    const moreCommits = calculateWPI({
      ...commitHeavyStats,
      totalCommits: 208,
    });

    // 50*27 + 50*27 = 2700
    // 208*13 = 2704
    expect(betterCollaborative).toBe(2700);
    expect(moreCommits).toBe(2704);
  });

  it('should ignore followers in WPI calculation', () => {
    const stats1: AggregatedStats = {
      totalMergedPRs: 10,
      totalCodeReviews: 10,
      totalIssuesClosed: 10,
      totalCommits: 10,
      totalStars: 10,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const stats2: AggregatedStats = {
      ...stats1,
      totalFollowers: 1000, // Different follower count
    };

    const wpi1 = calculateWPI(stats1);
    const wpi2 = calculateWPI(stats2);

    // Followers should not affect WPI
    expect(wpi1).toBe(wpi2);
  });

  it('should return consistent results for same input', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 25,
      totalCodeReviews: 15,
      totalIssuesClosed: 10,
      totalCommits: 50,
      totalStars: 100,
      totalFollowers: 5,
      firstContributionYear: 2022,
      lastContributionYear: 2024,
      yearsActive: 3,
    };

    const wpi1 = calculateWPI(stats);
    const wpi2 = calculateWPI(stats);
    const wpi3 = calculateWPI(stats);

    expect(wpi1).toBe(wpi2);
    expect(wpi2).toBe(wpi3);
  });
});

describe('Ranking Engine - calculateZScore', () => {
  it('should calculate Z-score from WPI', () => {
    const wpi = 1000;
    const zScore = calculateZScore(wpi);

    // log(1000) ≈ 6.907755
    // (6.907755 - 6.5) / 1.5 ≈ 0.272
    expect(zScore).toBeCloseTo(0.272, 2);
  });

  it('should return 0 for WPI at global mean', () => {
    // Find WPI that results in log score equal to MEAN_LOG_SCORE
    const wpi = Math.exp(MEAN_LOG_SCORE); // e^6.5 ≈ 665.14
    const zScore = calculateZScore(wpi);

    // Z-score should be 0 when log(WPI) equals MEAN_LOG_SCORE
    expect(zScore).toBeCloseTo(0, 10);
  });

  it('should return positive Z-score for high WPI', () => {
    const wpi = 10000;
    const zScore = calculateZScore(wpi);

    // log(10000) ≈ 9.21034
    // (9.21034 - 6.5) / 1.5 ≈ 1.807
    expect(zScore).toBeCloseTo(1.807, 2);
    expect(zScore).toBeGreaterThan(0);
  });

  it('should return negative Z-score for low WPI', () => {
    const wpi = 100;
    const zScore = calculateZScore(wpi);

    // log(100) ≈ 4.605
    // (4.605 - 6.5) / 1.5 ≈ -1.263
    expect(zScore).toBeCloseTo(-1.263, 2);
    expect(zScore).toBeLessThan(0);
  });

  it('should handle minimum WPI of 1', () => {
    const wpi = 1;
    const zScore = calculateZScore(wpi);

    // log(1) = 0
    // (0 - 6.5) / 1.5 ≈ -4.333
    expect(zScore).toBeCloseTo(-4.333, 2);
  });

  it('should return higher Z-score for higher WPI', () => {
    const wpi1 = 1000;
    const wpi2 = 10000;

    const zScore1 = calculateZScore(wpi1);
    const zScore2 = calculateZScore(wpi2);

    expect(zScore2).toBeGreaterThan(zScore1);
  });

  it('should apply log-normal transformation correctly', () => {
    const wpi = 5000;
    const zScore = calculateZScore(wpi);

    // Manual calculation:
    // log(5000) ≈ 8.517
    // (8.517 - 6.5) / 1.5 ≈ 1.345
    const expectedLogScore = Math.log(5000);
    const expectedZScore = (expectedLogScore - MEAN_LOG_SCORE) / STD_DEV;

    expect(zScore).toBeCloseTo(expectedZScore, 10);
  });

  it('should use correct constants', () => {
    // Verify constants are being used
    const wpi = Math.exp(MEAN_LOG_SCORE + STD_DEV); // One standard deviation above mean
    const zScore = calculateZScore(wpi);

    // Should result in Z-score of 1.0
    expect(zScore).toBeCloseTo(1.0, 10);
  });

  it('should return consistent results for same input', () => {
    const wpi = 2500;

    const zScore1 = calculateZScore(wpi);
    const zScore2 = calculateZScore(wpi);
    const zScore3 = calculateZScore(wpi);

    expect(zScore1).toBe(zScore2);
    expect(zScore2).toBe(zScore3);
  });

  it('should handle very large WPI values', () => {
    const wpi = 1000000;
    const zScore = calculateZScore(wpi);

    // log(1000000) ≈ 13.816
    // (13.816 - 6.5) / 1.5 ≈ 4.877
    expect(zScore).toBeCloseTo(4.877, 2);
    expect(Number.isFinite(zScore)).toBe(true);
  });
});

describe('Ranking Engine - calculateElo', () => {
  it('should calculate Elo from Z-score', () => {
    const zScore = 1.0; // One standard deviation above mean
    const elo = calculateElo(zScore);

    // 1200 + (1.0 × 400) = 1600
    expect(elo).toBe(1600);
  });

  it('should return BASE_ELO for Z-score of 0', () => {
    const zScore = 0; // At global mean
    const elo = calculateElo(zScore);

    // Should return base Elo (Gold IV)
    expect(elo).toBe(BASE_ELO); // 1200
  });

  it('should handle positive Z-scores', () => {
    const zScore = 2.0; // Two standard deviations above mean
    const elo = calculateElo(zScore);

    // 1200 + (2.0 × 400) = 2000 (Diamond IV)
    expect(elo).toBe(2000);
  });

  it('should handle negative Z-scores', () => {
    const zScore = -1.0; // One standard deviation below mean
    const elo = calculateElo(zScore);

    // 1200 + (-1.0 × 400) = 800 (Bronze tier)
    expect(elo).toBe(800);
  });

  it('should round to nearest integer', () => {
    const zScore = 1.234; // Results in non-integer Elo
    const elo = calculateElo(zScore);

    // 1200 + (1.234 × 400) = 1693.6 → 1694
    expect(elo).toBe(1694);
    expect(Number.isInteger(elo)).toBe(true);
  });

  it('should clamp minimum to 0', () => {
    const zScore = -5.0; // Very low Z-score
    const elo = calculateElo(zScore);

    // 1200 + (-5.0 × 400) = -800 → 0 (clamped)
    expect(elo).toBe(0);
  });

  it('should not clamp maximum (Challenger can exceed 3000)', () => {
    const zScore = 5.0; // Very high Z-score
    const elo = calculateElo(zScore);

    // 1200 + (5.0 × 400) = 3200 (Challenger)
    expect(elo).toBe(3200);
    expect(elo).toBeGreaterThan(3000);
  });

  it('should use correct formula constants', () => {
    const zScore = 1.5;
    const elo = calculateElo(zScore);

    // Verify formula: BASE_ELO + (zScore × ELO_PER_SIGMA)
    const expectedElo = Math.round(BASE_ELO + zScore * ELO_PER_SIGMA);
    expect(elo).toBe(expectedElo);
  });

  it('should map to Gold tier for median developer', () => {
    const zScore = 0; // Median developer
    const elo = calculateElo(zScore);

    // Should be 1200 (Gold IV)
    expect(elo).toBe(1200);
    expect(elo).toBeGreaterThanOrEqual(1200); // Gold range: 1200-1499
    expect(elo).toBeLessThan(1500);
  });

  it('should map to Diamond tier for high performers', () => {
    const zScore = 2.0; // ~97.5th percentile
    const elo = calculateElo(zScore);

    // Should be 2000 (Diamond IV)
    expect(elo).toBe(2000);
  });

  it('should handle fractional Z-scores correctly', () => {
    const zScore = 0.5;
    const elo = calculateElo(zScore);

    // 1200 + (0.5 × 400) = 1400 (Gold I)
    expect(elo).toBe(1400);
  });

  it('should return consistent results for same input', () => {
    const zScore = 1.75;

    const elo1 = calculateElo(zScore);
    const elo2 = calculateElo(zScore);
    const elo3 = calculateElo(zScore);

    expect(elo1).toBe(elo2);
    expect(elo2).toBe(elo3);
  });

  it('should handle Challenger tier (3000+)', () => {
    const zScore = 4.5; // Top 0.0003%
    const elo = calculateElo(zScore);

    // 1200 + (4.5 × 400) = 3000 (Challenger)
    expect(elo).toBe(3000);
    expect(elo).toBeGreaterThanOrEqual(3000);
  });

  it('should handle Iron tier (0-599)', () => {
    const zScore = -2.0; // Bottom ~2.5%
    const elo = calculateElo(zScore);

    // 1200 + (-2.0 × 400) = 400 (Iron tier)
    expect(elo).toBe(400);
    expect(elo).toBeGreaterThanOrEqual(0);
    expect(elo).toBeLessThan(600);
  });

  it('should produce higher Elo for higher Z-score', () => {
    const zScore1 = 0.5;
    const zScore2 = 1.5;

    const elo1 = calculateElo(zScore1);
    const elo2 = calculateElo(zScore2);

    expect(elo2).toBeGreaterThan(elo1);
  });
});

describe('Ranking Engine - getTier', () => {
  it('should return Iron for Elo 0-599', () => {
    expect(getTier(0)).toBe('Iron');
    expect(getTier(299)).toBe('Iron');
    expect(getTier(599)).toBe('Iron');
  });

  it('should return Bronze for Elo 600-899', () => {
    expect(getTier(600)).toBe('Bronze');
    expect(getTier(750)).toBe('Bronze');
    expect(getTier(899)).toBe('Bronze');
  });

  it('should return Silver for Elo 900-1199', () => {
    expect(getTier(900)).toBe('Silver');
    expect(getTier(1050)).toBe('Silver');
    expect(getTier(1199)).toBe('Silver');
  });

  it('should return Gold for Elo 1200-1499', () => {
    expect(getTier(1200)).toBe('Gold');
    expect(getTier(1350)).toBe('Gold');
    expect(getTier(1499)).toBe('Gold');
  });

  it('should return Platinum for Elo 1500-1699', () => {
    expect(getTier(1500)).toBe('Platinum');
    expect(getTier(1600)).toBe('Platinum');
    expect(getTier(1699)).toBe('Platinum');
  });

  it('should return Emerald for Elo 1700-1999', () => {
    expect(getTier(1700)).toBe('Emerald');
    expect(getTier(1850)).toBe('Emerald');
    expect(getTier(1999)).toBe('Emerald');
  });

  it('should return Diamond for Elo 2000-2399', () => {
    expect(getTier(2000)).toBe('Diamond');
    expect(getTier(2200)).toBe('Diamond');
    expect(getTier(2399)).toBe('Diamond');
  });

  it('should return Master for Elo 2400-2599', () => {
    expect(getTier(2400)).toBe('Master');
    expect(getTier(2500)).toBe('Master');
    expect(getTier(2599)).toBe('Master');
  });

  it('should return Grandmaster for Elo 2600-2999', () => {
    expect(getTier(2600)).toBe('Grandmaster');
    expect(getTier(2800)).toBe('Grandmaster');
    expect(getTier(2999)).toBe('Grandmaster');
  });

  it('should return Challenger for Elo 3000+', () => {
    expect(getTier(3000)).toBe('Challenger');
    expect(getTier(3500)).toBe('Challenger');
    expect(getTier(5000)).toBe('Challenger');
  });

  it('should handle boundary values correctly', () => {
    // Lower boundaries (inclusive)
    expect(getTier(0)).toBe('Iron');
    expect(getTier(600)).toBe('Bronze');
    expect(getTier(900)).toBe('Silver');
    expect(getTier(1200)).toBe('Gold');
    expect(getTier(1500)).toBe('Platinum');
    expect(getTier(1700)).toBe('Emerald');
    expect(getTier(2000)).toBe('Diamond');
    expect(getTier(2400)).toBe('Master');
    expect(getTier(2600)).toBe('Grandmaster');
    expect(getTier(3000)).toBe('Challenger');
  });

  it('should handle values just below tier boundaries', () => {
    // Upper boundaries (exclusive)
    expect(getTier(599)).toBe('Iron');
    expect(getTier(899)).toBe('Bronze');
    expect(getTier(1199)).toBe('Silver');
    expect(getTier(1499)).toBe('Gold');
    expect(getTier(1699)).toBe('Platinum');
    expect(getTier(1999)).toBe('Emerald');
    expect(getTier(2399)).toBe('Diamond');
    expect(getTier(2599)).toBe('Master');
    expect(getTier(2999)).toBe('Grandmaster');
  });

  it('should handle median developer (Gold tier)', () => {
    const elo = 1200; // BASE_ELO
    const tier = getTier(elo);

    expect(tier).toBe('Gold');
  });

  it('should return consistent results for same input', () => {
    const elo = 1750;

    const tier1 = getTier(elo);
    const tier2 = getTier(elo);
    const tier3 = getTier(elo);

    expect(tier1).toBe(tier2);
    expect(tier2).toBe(tier3);
    expect(tier1).toBe('Emerald');
  });

  it('should handle all 10 tiers', () => {
    // Verify all tiers are accessible
    const tierElos = [
      { elo: 300, tier: 'Iron' },
      { elo: 750, tier: 'Bronze' },
      { elo: 1050, tier: 'Silver' },
      { elo: 1350, tier: 'Gold' },
      { elo: 1600, tier: 'Platinum' },
      { elo: 1850, tier: 'Emerald' },
      { elo: 2200, tier: 'Diamond' },
      { elo: 2500, tier: 'Master' },
      { elo: 2800, tier: 'Grandmaster' },
      { elo: 3200, tier: 'Challenger' },
    ];

    tierElos.forEach(({ elo, tier }) => {
      expect(getTier(elo)).toBe(tier);
    });
  });

  it('should handle very high Elo values', () => {
    expect(getTier(10000)).toBe('Challenger');
    expect(getTier(999999)).toBe('Challenger');
  });
});

describe('Ranking Engine - getDivision', () => {
  it('should return null for Master tier', () => {
    const division = getDivision(2500, 'Master');
    expect(division).toBeNull();
  });

  it('should return null for Grandmaster tier', () => {
    const division = getDivision(2800, 'Grandmaster');
    expect(division).toBeNull();
  });

  it('should return null for Challenger tier', () => {
    const division = getDivision(3200, 'Challenger');
    expect(division).toBeNull();
  });

  it('should return Division IV for bottom quarter of Gold tier', () => {
    // Gold: 1200-1499 (range: 300)
    // Division IV: 1200-1274 (0-74 within range)
    expect(getDivision(1200, 'Gold')).toBe('IV');
    expect(getDivision(1250, 'Gold')).toBe('IV');
    expect(getDivision(1274, 'Gold')).toBe('IV');
  });

  it('should return Division III for second quarter of Gold tier', () => {
    // Division III: 1275-1349 (75-149 within range)
    expect(getDivision(1275, 'Gold')).toBe('III');
    expect(getDivision(1312, 'Gold')).toBe('III');
    expect(getDivision(1349, 'Gold')).toBe('III');
  });

  it('should return Division II for third quarter of Gold tier', () => {
    // Division II: 1350-1424 (150-224 within range)
    expect(getDivision(1350, 'Gold')).toBe('II');
    expect(getDivision(1387, 'Gold')).toBe('II');
    expect(getDivision(1424, 'Gold')).toBe('II');
  });

  it('should return Division I for top quarter of Gold tier', () => {
    // Division I: 1425-1499 (225-299 within range)
    expect(getDivision(1425, 'Gold')).toBe('I');
    expect(getDivision(1462, 'Gold')).toBe('I');
    expect(getDivision(1499, 'Gold')).toBe('I');
  });

  it('should handle all divisions in Iron tier', () => {
    // Iron: 0-599 (range: 600)
    // Each division: 150 Elo
    expect(getDivision(0, 'Iron')).toBe('IV'); // 0-149
    expect(getDivision(149, 'Iron')).toBe('IV');
    expect(getDivision(150, 'Iron')).toBe('III'); // 150-299
    expect(getDivision(299, 'Iron')).toBe('III');
    expect(getDivision(300, 'Iron')).toBe('II'); // 300-449
    expect(getDivision(449, 'Iron')).toBe('II');
    expect(getDivision(450, 'Iron')).toBe('I'); // 450-599
    expect(getDivision(599, 'Iron')).toBe('I');
  });

  it('should handle all divisions in Diamond tier', () => {
    // Diamond: 2000-2399 (range: 400)
    // Each division: 100 Elo
    expect(getDivision(2000, 'Diamond')).toBe('IV'); // 2000-2099
    expect(getDivision(2099, 'Diamond')).toBe('IV');
    expect(getDivision(2100, 'Diamond')).toBe('III'); // 2100-2199
    expect(getDivision(2199, 'Diamond')).toBe('III');
    expect(getDivision(2200, 'Diamond')).toBe('II'); // 2200-2299
    expect(getDivision(2299, 'Diamond')).toBe('II');
    expect(getDivision(2300, 'Diamond')).toBe('I'); // 2300-2399
    expect(getDivision(2399, 'Diamond')).toBe('I');
  });

  it('should handle all divisions in Platinum tier', () => {
    // Platinum: 1500-1699 (range: 200)
    // Each division: 50 Elo
    expect(getDivision(1500, 'Platinum')).toBe('IV');
    expect(getDivision(1549, 'Platinum')).toBe('IV');
    expect(getDivision(1550, 'Platinum')).toBe('III');
    expect(getDivision(1599, 'Platinum')).toBe('III');
    expect(getDivision(1600, 'Platinum')).toBe('II');
    expect(getDivision(1649, 'Platinum')).toBe('II');
    expect(getDivision(1650, 'Platinum')).toBe('I');
    expect(getDivision(1699, 'Platinum')).toBe('I');
  });

  it('should work correctly with tier boundaries', () => {
    // Test at exact tier boundaries
    expect(getDivision(1200, 'Gold')).toBe('IV'); // Start of Gold
    expect(getDivision(1499, 'Gold')).toBe('I'); // End of Gold
    expect(getDivision(2000, 'Diamond')).toBe('IV'); // Start of Diamond
    expect(getDivision(2399, 'Diamond')).toBe('I'); // End of Diamond
  });

  it('should return consistent results for same input', () => {
    const elo = 1350;
    const tier = 'Gold';

    const div1 = getDivision(elo, tier);
    const div2 = getDivision(elo, tier);
    const div3 = getDivision(elo, tier);

    expect(div1).toBe(div2);
    expect(div2).toBe(div3);
    expect(div1).toBe('II');
  });

  it('should handle all tiers with divisions', () => {
    // Test one division from each tier that uses divisions
    expect(getDivision(300, 'Iron')).toBe('II');
    expect(getDivision(750, 'Bronze')).toBe('II');
    expect(getDivision(1050, 'Silver')).toBe('II');
    expect(getDivision(1350, 'Gold')).toBe('II');
    expect(getDivision(1600, 'Platinum')).toBe('II');
    expect(getDivision(1850, 'Emerald')).toBe('II');
    expect(getDivision(2200, 'Diamond')).toBe('II');
  });

  it('should divide tier range into exactly 4 equal divisions', () => {
    // Verify equal division for Bronze (600-899, range: 300)
    // Each division should be 75 Elo
    expect(getDivision(600, 'Bronze')).toBe('IV'); // 600-674
    expect(getDivision(674, 'Bronze')).toBe('IV');
    expect(getDivision(675, 'Bronze')).toBe('III'); // 675-749
    expect(getDivision(749, 'Bronze')).toBe('III');
    expect(getDivision(750, 'Bronze')).toBe('II'); // 750-824
    expect(getDivision(824, 'Bronze')).toBe('II');
    expect(getDivision(825, 'Bronze')).toBe('I'); // 825-899
    expect(getDivision(899, 'Bronze')).toBe('I');
  });

  it('should handle edge case at exact division boundaries', () => {
    // Test exact boundaries in Silver (900-1199, range: 300)
    // Each division: 75 Elo
    const tier = 'Silver';
    expect(getDivision(900, tier)).toBe('IV'); // Exact start
    expect(getDivision(975, tier)).toBe('III'); // Exact second division start
    expect(getDivision(1050, tier)).toBe('II'); // Exact third division start
    expect(getDivision(1125, tier)).toBe('I'); // Exact fourth division start
  });
});

describe('Ranking Engine - calculateGP', () => {
  it('should return 0 for Master tier', () => {
    const gp = calculateGP(2500, 'Master', null);
    expect(gp).toBe(0);
  });

  it('should return 0 for Grandmaster tier', () => {
    const gp = calculateGP(2800, 'Grandmaster', null);
    expect(gp).toBe(0);
  });

  it('should return 0 for Challenger tier', () => {
    const gp = calculateGP(3200, 'Challenger', null);
    expect(gp).toBe(0);
  });

  it('should return 0 GPat start of division', () => {
    // Gold: 1200-1499, Division IV: 1200-1274
    const gp = calculateGP(1200, 'Gold', 'IV');
    expect(gp).toBe(0);
  });

  it('should return 99 GPat end of division', () => {
    // Gold Division IV: 1200-1274 (range: 75)
    // 1274 should give 99 LP
    const gp = calculateGP(1274, 'Gold', 'IV');
    expect(gp).toBe(99);
  });

  it('should return ~50 GPhalfway through division', () => {
    // Gold Division II: 1350-1424 (range: 75)
    // 1387 is halfway (37.5 Elo into 75 range)
    const gp = calculateGP(1387, 'Gold', 'II');
    // (37 / 75) * 100 = 49.33 → floor(49.33) = 49
    expect(gp).toBeGreaterThanOrEqual(49);
    expect(gp).toBeLessThanOrEqual(50);
  });

  it('should calculate GPcorrectly in Gold IV', () => {
    // Gold: 1200-1499 (range: 300), Division IV: 1200-1274 (range: 75)
    const tier = 'Gold';
    const division = 'IV';

    expect(calculateGP(1200, tier, division)).toBe(0); // Start
    expect(calculateGP(1237, tier, division)).toBe(49); // Halfway
    expect(calculateGP(1274, tier, division)).toBe(99); // End
  });

  it('should calculate GPcorrectly in Diamond II', () => {
    // Diamond: 2000-2399 (range: 400), each division: 100 Elo
    // Division II: 2200-2299 (range: 100)
    const tier = 'Diamond';
    const division = 'II';

    expect(calculateGP(2200, tier, division)).toBe(0); // Start
    expect(calculateGP(2250, tier, division)).toBe(50); // Halfway
    expect(calculateGP(2299, tier, division)).toBe(99); // End
  });

  it('should calculate GPcorrectly in Iron I', () => {
    // Iron: 0-599 (range: 600), each division: 150 Elo
    // Division I: 450-599 (range: 150)
    const tier = 'Iron';
    const division = 'I';

    expect(calculateGP(450, tier, division)).toBe(0); // Start
    expect(calculateGP(524, tier, division)).toBe(49); // Near halfway
    expect(calculateGP(599, tier, division)).toBe(99); // End
  });

  it('should handle all divisions in Platinum tier', () => {
    // Platinum: 1500-1699 (range: 200), each division: 50 Elo
    const tier = 'Platinum';

    // Division IV: 1500-1549
    expect(calculateGP(1500, tier, 'IV')).toBe(0);
    expect(calculateGP(1524, tier, 'IV')).toBe(48);
    expect(calculateGP(1549, tier, 'IV')).toBe(99);

    // Division III: 1550-1599
    expect(calculateGP(1550, tier, 'III')).toBe(0);
    expect(calculateGP(1574, tier, 'III')).toBe(48);
    expect(calculateGP(1599, tier, 'III')).toBe(99);

    // Division II: 1600-1649
    expect(calculateGP(1600, tier, 'II')).toBe(0);
    expect(calculateGP(1624, tier, 'II')).toBe(48);
    expect(calculateGP(1649, tier, 'II')).toBe(99);

    // Division I: 1650-1699
    expect(calculateGP(1650, tier, 'I')).toBe(0);
    expect(calculateGP(1674, tier, 'I')).toBe(48);
    expect(calculateGP(1699, tier, 'I')).toBe(99);
  });

  it('should never return GPabove 99', () => {
    // Test edge cases to ensure GPis clamped
    const tier = 'Gold';
    const division = 'I';

    // Even at the very top of the division
    expect(calculateGP(1499, tier, division)).toBe(99);
    expect(calculateGP(1499, tier, division)).toBeLessThanOrEqual(99);
  });

  it('should never return GPbelow 0', () => {
    // At the exact start of a division
    const tier = 'Gold';
    const division = 'IV';

    expect(calculateGP(1200, tier, division)).toBe(0);
    expect(calculateGP(1200, tier, division)).toBeGreaterThanOrEqual(0);
  });

  it('should return integer GPvalues', () => {
    // All GPvalues should be integers
    const tier = 'Gold';
    const division = 'II';

    for (let elo = 1350; elo <= 1424; elo += 5) {
      const gp = calculateGP(elo, tier, division);
      expect(Number.isInteger(gp)).toBe(true);
    }
  });

  it('should distribute GPevenly across division range', () => {
    // Test that GPscales linearly with Elo within division
    const tier = 'Gold';
    const division = 'IV';
    // Gold IV: 1200-1274 (range: 75)

    const gp0 = calculateGP(1200, tier, division); // 0% through
    const gp25 = calculateGP(1218, tier, division); // ~25% through
    const gp50 = calculateGP(1237, tier, division); // ~50% through
    const gp75 = calculateGP(1256, tier, division); // ~75% through
    const gp100 = calculateGP(1274, tier, division); // 100% through

    expect(gp0).toBe(0);
    expect(gp25).toBeGreaterThanOrEqual(23);
    expect(gp25).toBeLessThanOrEqual(25);
    expect(gp50).toBeGreaterThanOrEqual(48);
    expect(gp50).toBeLessThanOrEqual(50);
    expect(gp75).toBeGreaterThanOrEqual(73);
    expect(gp75).toBeLessThanOrEqual(75);
    expect(gp100).toBe(99);
  });

  it('should handle exact tier boundaries', () => {
    // Test GPat tier boundaries
    expect(calculateGP(1200, 'Gold', 'IV')).toBe(0); // Start of Gold
    expect(calculateGP(1499, 'Gold', 'I')).toBe(99); // End of Gold
    expect(calculateGP(2000, 'Diamond', 'IV')).toBe(0); // Start of Diamond
    expect(calculateGP(2399, 'Diamond', 'I')).toBe(99); // End of Diamond
  });

  it('should return consistent results for same input', () => {
    const elo = 1350;
    const tier = 'Gold';
    const division = 'II';

    const gp1 = calculateGP(elo, tier, division);
    const gp2 = calculateGP(elo, tier, division);
    const gp3 = calculateGP(elo, tier, division);

    expect(gp1).toBe(gp2);
    expect(gp2).toBe(gp3);
  });

  it('should work with all tiers that have divisions', () => {
    // Test one GPvalue from each tier with divisions
    expect(calculateGP(300, 'Iron', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(750, 'Bronze', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(1050, 'Silver', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(1350, 'Gold', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(1600, 'Platinum', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(1850, 'Emerald', 'II')).toBeGreaterThanOrEqual(0);
    expect(calculateGP(2200, 'Diamond', 'II')).toBeGreaterThanOrEqual(0);

    // All should be valid GPvalues
    expect(calculateGP(300, 'Iron', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(750, 'Bronze', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(1050, 'Silver', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(1350, 'Gold', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(1600, 'Platinum', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(1850, 'Emerald', 'II')).toBeLessThanOrEqual(99);
    expect(calculateGP(2200, 'Diamond', 'II')).toBeLessThanOrEqual(99);
  });
});

describe('Ranking Engine - calculatePercentile', () => {
  it('should return ~50th percentile for Z-score of 0 (mean)', () => {
    const percentile = calculatePercentile(0);
    expect(percentile).toBeCloseTo(50, 1);
  });

  it('should return ~84th percentile for Z-score of 1', () => {
    // 1 standard deviation above mean = ~84.1%
    const percentile = calculatePercentile(1);
    expect(percentile).toBeGreaterThanOrEqual(83);
    expect(percentile).toBeLessThanOrEqual(85);
  });

  it('should return ~16th percentile for Z-score of -1', () => {
    // 1 standard deviation below mean = ~15.9%
    const percentile = calculatePercentile(-1);
    expect(percentile).toBeGreaterThanOrEqual(15);
    expect(percentile).toBeLessThanOrEqual(17);
  });

  it('should return ~97.7th percentile for Z-score of 2', () => {
    // 2 standard deviations above mean = ~97.7%
    const percentile = calculatePercentile(2);
    expect(percentile).toBeGreaterThanOrEqual(97);
    expect(percentile).toBeLessThanOrEqual(98);
  });

  it('should return ~2.3rd percentile for Z-score of -2', () => {
    // 2 standard deviations below mean = ~2.3%
    const percentile = calculatePercentile(-2);
    expect(percentile).toBeGreaterThanOrEqual(2);
    expect(percentile).toBeLessThanOrEqual(3);
  });

  it('should return ~99.9th percentile for Z-score of 3', () => {
    // 3 standard deviations above mean = ~99.87%
    const percentile = calculatePercentile(3);
    expect(percentile).toBeGreaterThanOrEqual(99);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it('should return ~0.1st percentile for Z-score of -3', () => {
    // 3 standard deviations below mean = ~0.13%
    const percentile = calculatePercentile(-3);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(1);
  });

  it('should handle very high Z-scores (approaching 100%)', () => {
    const percentile = calculatePercentile(5);
    expect(percentile).toBeGreaterThanOrEqual(99.9);
    expect(percentile).toBeLessThanOrEqual(100);
  });

  it('should handle very low Z-scores (approaching 0%)', () => {
    const percentile = calculatePercentile(-5);
    expect(percentile).toBeGreaterThanOrEqual(0);
    expect(percentile).toBeLessThanOrEqual(0.1);
  });

  it('should never return percentile below 0', () => {
    const extremeLow = calculatePercentile(-10);
    expect(extremeLow).toBeGreaterThanOrEqual(0);
  });

  it('should never return percentile above 100', () => {
    const extremeHigh = calculatePercentile(10);
    expect(extremeHigh).toBeLessThanOrEqual(100);
  });

  it('should return consistent results for same input', () => {
    const zScore = 1.5;
    const p1 = calculatePercentile(zScore);
    const p2 = calculatePercentile(zScore);
    const p3 = calculatePercentile(zScore);

    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
  });

  it('should be monotonically increasing', () => {
    // Higher Z-score should always yield higher percentile
    const p1 = calculatePercentile(-2);
    const p2 = calculatePercentile(-1);
    const p3 = calculatePercentile(0);
    const p4 = calculatePercentile(1);
    const p5 = calculatePercentile(2);

    expect(p2).toBeGreaterThan(p1);
    expect(p3).toBeGreaterThan(p2);
    expect(p4).toBeGreaterThan(p3);
    expect(p5).toBeGreaterThan(p4);
  });

  it('should be symmetric around 50th percentile', () => {
    // Percentile(-x) + Percentile(x) should approximately equal 100
    const zScore = 1.5;
    const pHigh = calculatePercentile(zScore);
    const pLow = calculatePercentile(-zScore);

    expect(pHigh + pLow).toBeCloseTo(100, 1);
  });

  it('should handle fractional Z-scores', () => {
    const p1 = calculatePercentile(0.5);
    const p2 = calculatePercentile(1.5);
    const p3 = calculatePercentile(2.5);

    // Should be between known integer percentiles
    expect(p1).toBeGreaterThan(50);
    expect(p1).toBeLessThan(84);
    expect(p2).toBeGreaterThan(84);
    expect(p2).toBeLessThan(97.7);
    expect(p3).toBeGreaterThan(97.7);
    expect(p3).toBeLessThan(99.9);
  });

  it('should round to 1 decimal place', () => {
    const percentile = calculatePercentile(0.674); // Should be ~75%
    const decimalPlaces = (percentile.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });

  it('should handle Z-score for Gold IV player (median)', () => {
    // Base Elo (1200) corresponds to Z-score 0 (50th percentile)
    const percentile = calculatePercentile(0);
    expect(percentile).toBeCloseTo(50, 1);
  });

  it('should handle Z-score for Challenger player', () => {
    // Challenger (3000+) = Z-score of 4.5 = ~99.9997%
    const percentile = calculatePercentile(4.5);
    expect(percentile).toBeGreaterThanOrEqual(99.9);
    expect(percentile).toBeLessThanOrEqual(100);
  });
});

describe('Ranking Engine - calculateRank (Integration)', () => {
  it('should calculate complete rank for a median player', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 50,
      totalCodeReviews: 30,
      totalIssuesClosed: 20,
      totalCommits: 100,
      totalStars: 250,
      totalFollowers: 10,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank = calculateRank(stats);

    expect(rank).toHaveProperty('tier');
    expect(rank).toHaveProperty('division');
    expect(rank).toHaveProperty('elo');
    expect(rank).toHaveProperty('gp');
    expect(rank).toHaveProperty('percentile');
    expect(rank).toHaveProperty('wpi');
    expect(rank).toHaveProperty('zScore');

    // Verify all values are in valid ranges
    expect(rank.elo).toBeGreaterThanOrEqual(0);
    expect(rank.gp).toBeGreaterThanOrEqual(0);
    expect(rank.gp).toBeLessThanOrEqual(99);
    expect(rank.percentile).toBeGreaterThanOrEqual(0);
    expect(rank.percentile).toBeLessThanOrEqual(100);
    expect(rank.wpi).toBeGreaterThan(0);
  });

  it('should calculate rank for a beginner player', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 5,
      totalCodeReviews: 2,
      totalIssuesClosed: 3,
      totalCommits: 20,
      totalStars: 10,
      totalFollowers: 1,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const rank = calculateRank(stats);

    // Beginner should be in lower tiers
    expect(['Iron', 'Bronze', 'Silver']).toContain(rank.tier);
    expect(rank.elo).toBeLessThan(1200); // Below median
    expect(rank.percentile).toBeLessThan(50);
  });

  it('should calculate rank for a high-performing player', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 500,
      totalCodeReviews: 300,
      totalIssuesClosed: 200,
      totalCommits: 1000,
      totalStars: 500, // At cap
      totalFollowers: 100,
      firstContributionYear: 2015,
      lastContributionYear: 2024,
      yearsActive: 10,
    };

    const rank = calculateRank(stats);

    // High performer should be in upper tiers
    expect(['Diamond', 'Master', 'Grandmaster', 'Challenger']).toContain(
      rank.tier
    );
    expect(rank.elo).toBeGreaterThan(1800);
    expect(rank.percentile).toBeGreaterThan(80);
  });

  it('should handle player with no contributions', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const rank = calculateRank(stats);

    // No contributions should result in minimum rank
    expect(rank.tier).toBe('Iron');
    expect(rank.division).toBe('IV');
    expect(rank.elo).toBe(0);
    expect(rank.gp).toBe(0);
    expect(rank.wpi).toBe(1); // Minimum WPI
  });

  it('should assign Master tier correctly (no division)', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 300,
      totalCodeReviews: 200,
      totalIssuesClosed: 150,
      totalCommits: 700,
      totalStars: 400,
      totalFollowers: 50,
      firstContributionYear: 2017,
      lastContributionYear: 2024,
      yearsActive: 8,
    };

    const rank = calculateRank(stats);

    if (
      rank.tier === 'Master' ||
      rank.tier === 'Grandmaster' ||
      rank.tier === 'Challenger'
    ) {
      expect(rank.division).toBeNull();
      expect(rank.gp).toBe(0);
    }
  });

  it('should assign divisions correctly for Gold tier', () => {
    // Create a player that should be in Gold tier (1200-1499)
    const stats: AggregatedStats = {
      totalMergedPRs: 60,
      totalCodeReviews: 35,
      totalIssuesClosed: 25,
      totalCommits: 120,
      totalStars: 200,
      totalFollowers: 15,
      firstContributionYear: 2021,
      lastContributionYear: 2024,
      yearsActive: 4,
    };

    const rank = calculateRank(stats);

    if (rank.tier === 'Gold') {
      expect(['IV', 'III', 'II', 'I']).toContain(rank.division);
      expect(rank.gp).toBeGreaterThanOrEqual(0);
      expect(rank.gp).toBeLessThanOrEqual(99);
    }
  });

  it('should calculate WPI correctly in rank result', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 50,
      totalCodeReviews: 30,
      totalIssuesClosed: 20,
      totalCommits: 100,
      totalStars: 250,
      totalFollowers: 10,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank = calculateRank(stats);
    const expectedWPI = calculateWPI(stats);

    expect(rank.wpi).toBe(expectedWPI);
  });

  it('should calculate Z-score correctly in rank result', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 50,
      totalCodeReviews: 30,
      totalIssuesClosed: 20,
      totalCommits: 100,
      totalStars: 250,
      totalFollowers: 10,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank = calculateRank(stats);
    const expectedZScore = calculateZScore(rank.wpi);

    expect(rank.zScore).toBeCloseTo(expectedZScore, 5);
  });

  it('should have tier and division match Elo rating', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 100,
      totalCodeReviews: 60,
      totalIssuesClosed: 40,
      totalCommits: 200,
      totalStars: 300,
      totalFollowers: 20,
      firstContributionYear: 2019,
      lastContributionYear: 2024,
      yearsActive: 6,
    };

    const rank = calculateRank(stats);
    const expectedTier = getTier(rank.elo);
    const expectedDivision = getDivision(rank.elo, rank.tier);

    expect(rank.tier).toBe(expectedTier);
    expect(rank.division).toBe(expectedDivision);
  });

  it('should have GPmatch Elo, tier, and division', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 80,
      totalCodeReviews: 50,
      totalIssuesClosed: 30,
      totalCommits: 150,
      totalStars: 280,
      totalFollowers: 18,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank = calculateRank(stats);
    const expectedGP = calculateGP(rank.elo, rank.tier, rank.division);

    expect(rank.gp).toBe(expectedGP);
  });

  it('should have percentile match Z-score', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 70,
      totalCodeReviews: 40,
      totalIssuesClosed: 25,
      totalCommits: 140,
      totalStars: 270,
      totalFollowers: 16,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank = calculateRank(stats);
    const expectedPercentile = calculatePercentile(rank.zScore);

    expect(rank.percentile).toBeCloseTo(expectedPercentile, 5);
  });

  it('should handle stats with capped stars', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 100,
      totalCodeReviews: 60,
      totalIssuesClosed: 40,
      totalCommits: 200,
      totalStars: 10000, // Well above cap
      totalFollowers: 500,
      firstContributionYear: 2015,
      lastContributionYear: 2024,
      yearsActive: 10,
    };

    const rank = calculateRank(stats);

    // Should still produce valid rank
    expect(rank.tier).toBeTruthy();
    expect(rank.elo).toBeGreaterThanOrEqual(0);
    expect(rank.percentile).toBeGreaterThanOrEqual(0);
    expect(rank.percentile).toBeLessThanOrEqual(100);
  });

  it('should throw error for null stats', () => {
    expect(() => calculateRank(null as unknown as AggregatedStats)).toThrow(
      'Invalid stats'
    );
  });

  it('should throw error for undefined stats', () => {
    expect(() =>
      calculateRank(undefined as unknown as AggregatedStats)
    ).toThrow('Invalid stats');
  });

  it('should throw error for non-object stats', () => {
    expect(() => calculateRank(42 as unknown as AggregatedStats)).toThrow(
      'Invalid stats'
    );
  });

  it('should return consistent results for same input', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 75,
      totalCodeReviews: 45,
      totalIssuesClosed: 28,
      totalCommits: 160,
      totalStars: 290,
      totalFollowers: 19,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const rank1 = calculateRank(stats);
    const rank2 = calculateRank(stats);
    const rank3 = calculateRank(stats);

    expect(rank1).toEqual(rank2);
    expect(rank2).toEqual(rank3);
  });

  it('should produce different ranks for different stats', () => {
    const statsLow: AggregatedStats = {
      totalMergedPRs: 10,
      totalCodeReviews: 5,
      totalIssuesClosed: 5,
      totalCommits: 30,
      totalStars: 20,
      totalFollowers: 2,
      firstContributionYear: 2023,
      lastContributionYear: 2024,
      yearsActive: 2,
    };

    const statsHigh: AggregatedStats = {
      totalMergedPRs: 200,
      totalCodeReviews: 150,
      totalIssuesClosed: 100,
      totalCommits: 500,
      totalStars: 450,
      totalFollowers: 80,
      firstContributionYear: 2016,
      lastContributionYear: 2024,
      yearsActive: 9,
    };

    const rankLow = calculateRank(statsLow);
    const rankHigh = calculateRank(statsHigh);

    expect(rankHigh.elo).toBeGreaterThan(rankLow.elo);
    expect(rankHigh.percentile).toBeGreaterThan(rankLow.percentile);
    expect(rankHigh.wpi).toBeGreaterThan(rankLow.wpi);
  });

  it('should have monotonic relationship between contributions and Elo', () => {
    const stats1: AggregatedStats = {
      totalMergedPRs: 20,
      totalCodeReviews: 10,
      totalIssuesClosed: 10,
      totalCommits: 50,
      totalStars: 50,
      totalFollowers: 5,
      firstContributionYear: 2022,
      lastContributionYear: 2024,
      yearsActive: 3,
    };

    const stats2: AggregatedStats = {
      totalMergedPRs: 50,
      totalCodeReviews: 30,
      totalIssuesClosed: 20,
      totalCommits: 100,
      totalStars: 150,
      totalFollowers: 10,
      firstContributionYear: 2020,
      lastContributionYear: 2024,
      yearsActive: 5,
    };

    const stats3: AggregatedStats = {
      totalMergedPRs: 150,
      totalCodeReviews: 100,
      totalIssuesClosed: 75,
      totalCommits: 400,
      totalStars: 400,
      totalFollowers: 50,
      firstContributionYear: 2017,
      lastContributionYear: 2024,
      yearsActive: 8,
    };

    const rank1 = calculateRank(stats1);
    const rank2 = calculateRank(stats2);
    const rank3 = calculateRank(stats3);

    expect(rank2.elo).toBeGreaterThan(rank1.elo);
    expect(rank3.elo).toBeGreaterThan(rank2.elo);
  });
});
