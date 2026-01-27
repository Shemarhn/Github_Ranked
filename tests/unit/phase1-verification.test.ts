/**
 * Phase 1 Verification Tests
 * Comprehensive tests to verify all Phase 1 implementations
 */

import { describe, it, expect } from 'vitest';

// Import GitHub types and type guards
import type {
  YearlyStats,
  AggregatedStats,
  GraphQLUserResponse,
  RateLimitInfo,
} from '@/lib/github/types';
import { isAggregatedStats } from '@/lib/github/types';

// Import Ranking types and type guards
import type { Tier, Division, RankResult } from '@/lib/ranking/types';
import { TIERS, DIVISIONS, isTier, isDivision } from '@/lib/ranking/types';

// Import Ranking constants
import {
  MEAN_LOG_SCORE,
  STD_DEV,
  BASE_ELO,
  ELO_PER_SIGMA,
  METRIC_WEIGHTS,
  MAX_STARS_CAP,
  TIER_THRESHOLDS,
  TIERS_WITH_DIVISIONS,
  TIER_COLORS,
  MAX_GP,
  MIN_GP,
} from '@/lib/ranking/constants';

describe('Phase 1: Core Infrastructure', () => {
  describe('P1-T1: GitHub API Types', () => {
    it('should have YearlyStats interface with correct structure', () => {
      const mockYearlyStats: YearlyStats = {
        year: 2024,
        commits: 100,
        prs: 20,
        reviews: 30,
        issues: 15,
        privateContributions: 50,
      };

      expect(mockYearlyStats.year).toBe(2024);
      expect(mockYearlyStats.commits).toBeTypeOf('number');
    });

    it('should have AggregatedStats interface with correct structure', () => {
      const mockAggregatedStats: AggregatedStats = {
        totalCommits: 500,
        totalMergedPRs: 100,
        totalCodeReviews: 150,
        totalIssuesClosed: 75,
        totalStars: 200,
        totalFollowers: 50,
        firstContributionYear: 2020,
        lastContributionYear: 2024,
        yearsActive: 5,
      };

      expect(mockAggregatedStats.totalCommits).toBe(500);
      expect(mockAggregatedStats.yearsActive).toBe(5);
    });

    it('should have GraphQLUserResponse interface with correct structure', () => {
      const mockResponse: GraphQLUserResponse = {
        user: {
          login: 'octocat',
          name: 'The Octocat',
          createdAt: '2011-01-25T18:44:36Z',
          contributionsCollection: {
            totalCommitContributions: 100,
            totalPullRequestContributions: 20,
            totalPullRequestReviewContributions: 30,
            totalIssueContributions: 15,
            restrictedContributionsCount: 50,
          },
          repositories: {
            totalCount: 10,
            nodes: [],
          },
          followers: {
            totalCount: 100,
          },
        },
      };

      expect(mockResponse.user?.login).toBe('octocat');
    });

    it('should have RateLimitInfo interface', () => {
      const mockRateLimit: RateLimitInfo = {
        limit: 5000,
        cost: 1,
        remaining: 4999,
        resetAt: '2024-01-01T00:00:00Z',
      };

      expect(mockRateLimit.limit).toBe(5000);
    });
  });

  describe('P1-T2: Ranking Types', () => {
    it('should have Tier type with all 10 tiers', () => {
      const tiers: Tier[] = [
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

      expect(tiers).toHaveLength(10);
      expect(TIERS).toEqual(tiers);
    });

    it('should have Division type with all 4 divisions', () => {
      const divisions: Division[] = ['IV', 'III', 'II', 'I'];
      expect(divisions).toHaveLength(4);
      expect(DIVISIONS).toEqual(divisions);
    });

    it('should have RankResult interface with correct structure', () => {
      const mockRankResult: RankResult = {
        tier: 'Gold',
        division: 'II',
        elo: 1350,
        gp: 45,
        percentile: 55.5,
        wpi: 5000,
        zScore: 0.5,
      };

      expect(mockRankResult.tier).toBe('Gold');
      expect(mockRankResult.division).toBe('II');
      expect(mockRankResult.elo).toBe(1350);
    });

    it('should allow null division for Master+ tiers', () => {
      const masterRank: RankResult = {
        tier: 'Master',
        division: null,
        elo: 2500,
        gp: 75,
        percentile: 99.5,
        wpi: 50000,
        zScore: 3.0,
      };

      expect(masterRank.division).toBeNull();
    });
  });

  describe('P1-T3: Type Guards', () => {
    describe('isTier', () => {
      it('should return true for valid tiers', () => {
        expect(isTier('Iron')).toBe(true);
        expect(isTier('Gold')).toBe(true);
        expect(isTier('Challenger')).toBe(true);
      });

      it('should return false for invalid tiers', () => {
        expect(isTier('Platinum2')).toBe(false);
        expect(isTier('invalid')).toBe(false);
        expect(isTier(123)).toBe(false);
        expect(isTier(null)).toBe(false);
        expect(isTier(undefined)).toBe(false);
      });
    });

    describe('isDivision', () => {
      it('should return true for valid divisions', () => {
        expect(isDivision('IV')).toBe(true);
        expect(isDivision('III')).toBe(true);
        expect(isDivision('II')).toBe(true);
        expect(isDivision('I')).toBe(true);
      });

      it('should return false for invalid divisions', () => {
        expect(isDivision('V')).toBe(false);
        expect(isDivision('1')).toBe(false);
        expect(isDivision(1)).toBe(false);
        expect(isDivision(null)).toBe(false);
      });
    });

    describe('isAggregatedStats', () => {
      it('should return true for valid AggregatedStats', () => {
        const validStats = {
          totalCommits: 500,
          totalMergedPRs: 100,
          totalCodeReviews: 150,
          totalIssuesClosed: 75,
          totalStars: 200,
          totalFollowers: 50,
          firstContributionYear: 2020,
          lastContributionYear: 2024,
          yearsActive: 5,
        };

        expect(isAggregatedStats(validStats)).toBe(true);
      });

      it('should return false for invalid AggregatedStats', () => {
        expect(isAggregatedStats(null)).toBe(false);
        expect(isAggregatedStats(undefined)).toBe(false);
        expect(isAggregatedStats('invalid')).toBe(false);
        expect(isAggregatedStats({})).toBe(false);

        // Missing required fields
        expect(
          isAggregatedStats({
            totalCommits: 500,
            // missing other fields
          })
        ).toBe(false);

        // Invalid field types
        expect(
          isAggregatedStats({
            totalCommits: '500', // string instead of number
            totalMergedPRs: 100,
            totalCodeReviews: 150,
            totalIssuesClosed: 75,
            totalStars: 200,
            totalFollowers: 50,
            firstContributionYear: 2020,
            lastContributionYear: 2024,
            yearsActive: 5,
          })
        ).toBe(false);
      });
    });
  });

  describe('P1-T8: Ranking Constants', () => {
    it('should have correct algorithm constants', () => {
      expect(MEAN_LOG_SCORE).toBe(6.5);
      expect(STD_DEV).toBe(1.5);
      expect(BASE_ELO).toBe(1200);
      expect(ELO_PER_SIGMA).toBe(400);
    });

    it('should have correct metric weights', () => {
      expect(METRIC_WEIGHTS.mergedPRs).toBe(27);
      expect(METRIC_WEIGHTS.codeReviews).toBe(27);
      expect(METRIC_WEIGHTS.issuesClosed).toBe(18);
      expect(METRIC_WEIGHTS.commits).toBe(13);
      expect(METRIC_WEIGHTS.stars).toBe(15);
    });

    it('should have MAX_STARS_CAP', () => {
      expect(MAX_STARS_CAP).toBe(10_000);
    });

    it('should have tier thresholds for all 10 tiers', () => {
      expect(Object.keys(TIER_THRESHOLDS)).toHaveLength(10);

      expect(TIER_THRESHOLDS.Iron).toEqual({ min: 0, max: 600 });
      expect(TIER_THRESHOLDS.Bronze).toEqual({ min: 600, max: 900 });
      expect(TIER_THRESHOLDS.Silver).toEqual({ min: 900, max: 1200 });
      expect(TIER_THRESHOLDS.Gold).toEqual({ min: 1200, max: 1500 });
      expect(TIER_THRESHOLDS.Platinum).toEqual({ min: 1500, max: 1700 });
      expect(TIER_THRESHOLDS.Emerald).toEqual({ min: 1700, max: 2000 });
      expect(TIER_THRESHOLDS.Diamond).toEqual({ min: 2000, max: 2400 });
      expect(TIER_THRESHOLDS.Master).toEqual({ min: 2400, max: 2600 });
      expect(TIER_THRESHOLDS.Grandmaster).toEqual({ min: 2600, max: 3000 });
      expect(TIER_THRESHOLDS.Challenger).toEqual({
        min: 3000,
        max: Infinity,
      });
    });

    it('should have tier colors for all 10 tiers', () => {
      expect(Object.keys(TIER_COLORS)).toHaveLength(10);

      // Verify structure
      expect(TIER_COLORS.Iron.primary).toHaveLength(2);
      expect(TIER_COLORS.Iron.accent).toBeTypeOf('string');

      // Verify all tiers have colors
      TIERS.forEach((tier) => {
        expect(TIER_COLORS[tier]).toBeDefined();
        expect(TIER_COLORS[tier].primary).toHaveLength(2);
        expect(TIER_COLORS[tier].accent).toBeTypeOf('string');
      });
    });

    it('should have TIERS_WITH_DIVISIONS set', () => {
      expect(TIERS_WITH_DIVISIONS.size).toBe(7);
      expect(TIERS_WITH_DIVISIONS.has('Iron')).toBe(true);
      expect(TIERS_WITH_DIVISIONS.has('Diamond')).toBe(true);
      expect(TIERS_WITH_DIVISIONS.has('Master')).toBe(false);
      expect(TIERS_WITH_DIVISIONS.has('Grandmaster')).toBe(false);
      expect(TIERS_WITH_DIVISIONS.has('Challenger')).toBe(false);
    });

    it('should have GP constants', () => {
      expect(MAX_GP).toBe(99);
      expect(MIN_GP).toBe(0);
    });
  });

  describe('Phase 1 Integration', () => {
    it('should have all types properly exported and importable', () => {
      // This test passing means all imports at the top worked
      expect(TIERS).toBeDefined();
      expect(DIVISIONS).toBeDefined();
      expect(TIER_THRESHOLDS).toBeDefined();
      expect(isTier).toBeDefined();
      expect(isDivision).toBeDefined();
      expect(isAggregatedStats).toBeDefined();
    });

    it('should have consistent tier ordering', () => {
      const tierOrder = [
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

      TIERS.forEach((tier, index) => {
        expect(tier).toBe(tierOrder[index]);
      });
    });

    it('should have non-overlapping tier thresholds', () => {
      const tiers = TIERS.slice(); // Copy array

      for (let i = 0; i < tiers.length - 1; i++) {
        const currentTier = tiers[i];
        const nextTier = tiers[i + 1];

        expect(TIER_THRESHOLDS[currentTier].max).toBe(
          TIER_THRESHOLDS[nextTier].min
        );
      }
    });
  });
});
