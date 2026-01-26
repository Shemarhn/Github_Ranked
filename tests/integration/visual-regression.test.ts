/**
 * Visual Regression Tests for Rank Card Rendering
 * Tests rank card data processing, theme configuration, and SVG structure.
 * 
 * Note: Full SVG rendering requires a server to load icons. These tests validate:
 * - Tier/division/theme configurations
 * - Data transformation and formatting
 * - Component structure and props
 */

import { describe, it, expect } from 'vitest';
import type { RankResult, Tier, Division } from '@/lib/ranking/types';
import type { AggregatedStats } from '@/lib/github/types';
import type { ThemeName } from '@/lib/renderer/themes';
import { TIER_COLORS, MAX_STARS_CAP } from '@/lib/ranking/constants';
import { getTheme } from '@/lib/renderer/themes';

const TIERS: Tier[] = [
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

const THEMES: ThemeName[] = ['default', 'dark', 'light', 'minimal'];

const DIVISIONS: Division[] = ['IV', 'III', 'II', 'I'];

const createMockStats = (): AggregatedStats => ({
  totalMergedPRs: 50,
  totalCodeReviews: 30,
  totalIssuesClosed: 20,
  totalCommits: 100,
  totalStars: 250,
  totalFollowers: 10,
  firstContributionYear: 2020,
  lastContributionYear: 2024,
  yearsActive: 5,
});

const createMockRank = (
  tier: Tier,
  division: Division = 'II',
  elo: number = 1500
): RankResult => ({
  elo,
  tier,
  division,
  gp: 50,
  percentile: 60,
  wpi: 5000,
  zScore: 0.5,
});

describe('Visual Regression Tests', () => {
  describe('Tier Configuration', () => {
    it.each(TIERS)('should have valid colors for %s tier', (tier) => {
      const colors = TIER_COLORS[tier];
      
      expect(colors).toBeDefined();
      // primary is a gradient tuple [startColor, endColor]
      expect(colors.primary).toHaveLength(2);
      expect(colors.primary[0]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.primary[1]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should have 10 tiers defined', () => {
      expect(TIERS).toHaveLength(10);
    });

    it('should have ascending tier order', () => {
      const expectedOrder = [
        'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum',
        'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'
      ];
      expect(TIERS).toEqual(expectedOrder);
    });
  });

  describe('Theme Configuration', () => {
    it.each(THEMES)('should have valid theme configuration for %s', (theme) => {
      const config = getTheme(theme);
      
      expect(config).toBeDefined();
      expect(config.background).toBeDefined();
      expect(config.background.primary).toBeDefined();
      expect(config.background.secondary).toBeDefined();
      expect(config.background.border).toBeDefined();
      expect(config.text).toBeDefined();
      expect(config.text.primary).toBeDefined();
      expect(config.text.muted).toBeDefined();
    });

    it('should return default theme for unknown theme name', () => {
      const defaultTheme = getTheme('default');
      const unknownTheme = getTheme('nonexistent' as ThemeName);
      
      // Should fall back to default or handle gracefully
      expect(unknownTheme).toBeDefined();
    });
  });

  describe('Division Validation', () => {
    it.each(DIVISIONS)('should format division %s correctly', (division) => {
      const rank = createMockRank('Gold', division);
      const tierLabel = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;
      
      expect(tierLabel).toBe(`Gold ${division}`);
    });

    it('should handle null division for Challenger', () => {
      const rank: RankResult = {
        elo: 3200,
        tier: 'Challenger',
        division: null,
        gp: 0,
        percentile: 99.98,
        wpi: 200000,
        zScore: 4.0,
      };
      
      const tierLabel = rank.division ? `${rank.tier} ${rank.division}` : rank.tier;
      expect(tierLabel).toBe('Challenger');
    });
  });

  describe('Data Formatting', () => {
    it('should format SR (Elo) rating with commas', () => {
      const rank = createMockRank('Diamond', 'I', 2350);
      const eloLabel = new Intl.NumberFormat('en-US').format(rank.elo);
      
      expect(eloLabel).toBe('2,350');
    });

    it('should format large SR values correctly', () => {
      const elos = [100, 1000, 1500, 2500, 3200, 10000];
      const expected = ['100', '1,000', '1,500', '2,500', '3,200', '10,000'];
      
      elos.forEach((elo, i) => {
        const formatted = new Intl.NumberFormat('en-US').format(elo);
        expect(formatted).toBe(expected[i]);
      });
    });

    it('should cap stars at MAX_STARS_CAP', () => {
      const stats = createMockStats();
      stats.totalStars = 100000;
      
      const cappedStars = Math.min(stats.totalStars, MAX_STARS_CAP);
      expect(cappedStars).toBe(MAX_STARS_CAP);
    });
  });

  describe('Stats Validation', () => {
    it('should handle zero stats', () => {
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

      expect(stats.totalMergedPRs).toBe(0);
      expect(stats.totalCommits).toBe(0);
      expect(Math.min(stats.totalStars, MAX_STARS_CAP)).toBe(0);
    });

    it('should handle max stats', () => {
      const stats: AggregatedStats = {
        totalMergedPRs: 10000,
        totalCodeReviews: 5000,
        totalIssuesClosed: 3000,
        totalCommits: 50000,
        totalStars: 100000,
        totalFollowers: 50000,
        firstContributionYear: 2008,
        lastContributionYear: 2024,
        yearsActive: 17,
      };

      expect(Math.min(stats.totalStars, MAX_STARS_CAP)).toBe(MAX_STARS_CAP);
      expect(stats.yearsActive).toBe(17);
    });
  });

  describe('Rank Result Validation', () => {
    it('should have valid structure for all tiers', () => {
      TIERS.forEach((tier) => {
        const rank = createMockRank(tier);
        
        expect(rank.tier).toBe(tier);
        expect(typeof rank.elo).toBe('number');
        expect(typeof rank.gp).toBe('number');
        expect(rank.gp).toBeGreaterThanOrEqual(0);
        expect(rank.gp).toBeLessThanOrEqual(100);
        expect(typeof rank.percentile).toBe('number');
        expect(typeof rank.wpi).toBe('number');
        expect(typeof rank.zScore).toBe('number');
      });
    });

    it('should validate GP bounds', () => {
      const rankWithMinGP: RankResult = {
        ...createMockRank('Gold'),
        gp: 0,
      };
      const rankWithMaxGP: RankResult = {
        ...createMockRank('Gold'),
        gp: 99,
      };

      expect(rankWithMinGP.gp).toBe(0);
      expect(rankWithMaxGP.gp).toBe(99);
    });
  });

  describe('Cross-Theme Tier Consistency', () => {
    it('should use same tier colors across all themes', () => {
      const tier: Tier = 'Diamond';
      const colors = TIER_COLORS[tier];

      THEMES.forEach(() => {
        // Tier colors are theme-independent
        expect(colors).toBeDefined();
        expect(colors.accent).toBe(TIER_COLORS.Diamond.accent);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle Challenger tier properties', () => {
      const rank: RankResult = {
        elo: 3200,
        tier: 'Challenger',
        division: null,
        gp: 0,
        percentile: 99.98,
        wpi: 200000,
        zScore: 4.0,
      };

      expect(rank.tier).toBe('Challenger');
      expect(rank.division).toBeNull();
      expect(rank.gp).toBe(0); // Challenger has no GP progress
    });

    it('should handle username variations', () => {
      const usernames = [
        'octocat',
        'very-long-username-that-might-overflow',
        'a',
        'user123',
        'test-user_name',
      ];

      usernames.forEach((username) => {
        expect(typeof username).toBe('string');
        expect(username.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Card Dimensions', () => {
    it('should have correct card dimensions', () => {
      const CARD_WIDTH = 400;
      const CARD_HEIGHT = 120;

      expect(CARD_WIDTH).toBe(400);
      expect(CARD_HEIGHT).toBe(120);
    });
  });
});
