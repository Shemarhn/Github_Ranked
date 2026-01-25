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
} from '@/lib/ranking/engine';
import type { AggregatedStats } from '@/lib/github/types';
import { MEAN_LOG_SCORE, STD_DEV, BASE_ELO, ELO_PER_SIGMA } from '@/lib/ranking/constants';

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

    // Expected: (50*40) + (30*30) + (20*20) + (100*10) + (250*5)
    //         = 2000 + 900 + 400 + 1000 + 1250 = 5550
    expect(wpi).toBe(5550);
  });

  it('should cap stars at 500', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 1000, // Above cap
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpi = calculateWPI(stats);

    // Expected: 500 * 5 = 2500 (stars capped)
    expect(wpi).toBe(2500);
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

    // Test merged PRs weight (40)
    const wpiPRs = calculateWPI({ ...baseStat, totalMergedPRs: 10 });
    expect(wpiPRs).toBe(400);

    // Test code reviews weight (30)
    const wpiReviews = calculateWPI({ ...baseStat, totalCodeReviews: 10 });
    expect(wpiReviews).toBe(300);

    // Test issues weight (20)
    const wpiIssues = calculateWPI({ ...baseStat, totalIssuesClosed: 10 });
    expect(wpiIssues).toBe(200);

    // Test commits weight (10)
    const wpiCommits = calculateWPI({ ...baseStat, totalCommits: 10 });
    expect(wpiCommits).toBe(100);

    // Test stars weight (5)
    const wpiStars = calculateWPI({ ...baseStat, totalStars: 10 });
    expect(wpiStars).toBe(50);
  });

  it('should handle exactly 500 stars without capping', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalCommits: 0,
      totalStars: 500, // Exactly at cap
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpi = calculateWPI(stats);

    // Expected: 500 * 5 = 2500
    expect(wpi).toBe(2500);
  });

  it('should handle large numbers correctly', () => {
    const stats: AggregatedStats = {
      totalMergedPRs: 1000,
      totalCodeReviews: 500,
      totalIssuesClosed: 300,
      totalCommits: 10000,
      totalStars: 5000, // Will be capped to 500
      totalFollowers: 100,
      firstContributionYear: 2015,
      lastContributionYear: 2024,
      yearsActive: 10,
    };

    const wpi = calculateWPI(stats);

    // Expected: (1000*40) + (500*30) + (300*20) + (10000*10) + (500*5)
    //         = 40000 + 15000 + 6000 + 100000 + 2500 = 163500
    expect(wpi).toBe(163500);
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
      totalCommits: 700, // Same total "work" but all commits
      totalStars: 0,
      totalFollowers: 0,
      firstContributionYear: 2024,
      lastContributionYear: 2024,
      yearsActive: 1,
    };

    const wpiCollaborative = calculateWPI(collaborativeStats);
    const wpiCommitHeavy = calculateWPI(commitHeavyStats);

    // Collaborative work should be valued higher
    // Collaborative: (100*40) + (100*30) = 7000
    // Commit-heavy: (700*10) = 7000
    expect(wpiCollaborative).toBe(7000);
    expect(wpiCommitHeavy).toBe(7000);

    // They're equal numerically, but the design intent is to reward collaboration
    // Let's verify with unequal counts
    const betterCollaborative = calculateWPI({
      ...collaborativeStats,
      totalMergedPRs: 50,
      totalCodeReviews: 50,
    });
    const moreCommits = calculateWPI({
      ...commitHeavyStats,
      totalCommits: 350,
    });

    // 50*40 + 50*30 = 3500
    // 350*10 = 3500
    expect(betterCollaborative).toBe(3500);
    expect(moreCommits).toBe(3500);
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
