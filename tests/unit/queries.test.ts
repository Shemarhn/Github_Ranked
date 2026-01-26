/**
 * Unit Tests for GraphQL Query Builders
 */

import { describe, it, expect } from 'vitest';
import {
  buildUserStatsQuery,
  buildContributionYearsQuery,
  getYearDates,
  USER_STATS_QUERY,
  CONTRIBUTION_YEARS_QUERY,
} from '@/lib/github/queries';

describe('Query Builders', () => {
  describe('buildUserStatsQuery', () => {
    it('should build query with Date objects', () => {
      const from = new Date('2024-01-01T00:00:00.000Z');
      const to = new Date('2024-12-31T23:59:59.999Z');

      const request = buildUserStatsQuery('octocat', from, to);

      expect(request.query).toBe(USER_STATS_QUERY);
      expect(request.variables).toEqual({
        login: 'octocat',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      });
    });

    it('should build query with ISO 8601 strings', () => {
      const request = buildUserStatsQuery(
        'octocat',
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T23:59:59.999Z'
      );

      expect(request.query).toBe(USER_STATS_QUERY);
      expect(request.variables).toEqual({
        login: 'octocat',
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.999Z',
      });
    });

    it('should handle mixed Date and string inputs', () => {
      const from = new Date('2024-01-01T00:00:00.000Z');
      const to = '2024-12-31T23:59:59.999Z';

      const request = buildUserStatsQuery('octocat', from, to);

      expect(request.variables.from).toBe('2024-01-01T00:00:00.000Z');
      expect(request.variables.to).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should correctly format username', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');

      const request = buildUserStatsQuery('test-user-123', from, to);

      expect(request.variables.login).toBe('test-user-123');
    });
  });

  describe('buildContributionYearsQuery', () => {
    it('should build query with username', () => {
      const request = buildContributionYearsQuery('octocat');

      expect(request.query).toBe(CONTRIBUTION_YEARS_QUERY);
      expect(request.variables).toEqual({
        login: 'octocat',
      });
    });

    it('should handle different usernames', () => {
      const request1 = buildContributionYearsQuery('user-1');
      const request2 = buildContributionYearsQuery('user-2');

      expect(request1.variables.login).toBe('user-1');
      expect(request2.variables.login).toBe('user-2');
    });
  });

  describe('getYearDates', () => {
    it('should return correct start and end dates for a year', () => {
      const { from, to } = getYearDates(2024);

      expect(from.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(to.toISOString()).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should handle different years correctly', () => {
      const { from: from2020, to: to2020 } = getYearDates(2020);
      const { from: from2023, to: to2023 } = getYearDates(2023);

      expect(from2020.toISOString()).toBe('2020-01-01T00:00:00.000Z');
      expect(to2020.toISOString()).toBe('2020-12-31T23:59:59.999Z');

      expect(from2023.toISOString()).toBe('2023-01-01T00:00:00.000Z');
      expect(to2023.toISOString()).toBe('2023-12-31T23:59:59.999Z');
    });

    it('should return Date objects', () => {
      const { from, to } = getYearDates(2024);

      expect(from).toBeInstanceOf(Date);
      expect(to).toBeInstanceOf(Date);
    });

    it('should handle leap years correctly', () => {
      // 2024 is a leap year (Feb 29th exists)
      const { to } = getYearDates(2024);

      // End date should still be Dec 31st
      expect(to.getUTCMonth()).toBe(11); // December (0-indexed)
      expect(to.getUTCDate()).toBe(31);
    });

    it('should use UTC timezone', () => {
      const { from, to } = getYearDates(2024);

      // Verify UTC components
      expect(from.getUTCFullYear()).toBe(2024);
      expect(from.getUTCMonth()).toBe(0); // January
      expect(from.getUTCDate()).toBe(1);
      expect(from.getUTCHours()).toBe(0);
      expect(from.getUTCMinutes()).toBe(0);
      expect(from.getUTCSeconds()).toBe(0);
      expect(from.getUTCMilliseconds()).toBe(0);

      expect(to.getUTCFullYear()).toBe(2024);
      expect(to.getUTCMonth()).toBe(11); // December
      expect(to.getUTCDate()).toBe(31);
      expect(to.getUTCHours()).toBe(23);
      expect(to.getUTCMinutes()).toBe(59);
      expect(to.getUTCSeconds()).toBe(59);
      expect(to.getUTCMilliseconds()).toBe(999);
    });
  });

  describe('Query String Constants', () => {
    it('should export USER_STATS_QUERY', () => {
      expect(USER_STATS_QUERY).toBeTypeOf('string');
      expect(USER_STATS_QUERY).toContain('query UserStats');
      expect(USER_STATS_QUERY).toContain('$login: String!');
      expect(USER_STATS_QUERY).toContain('$from: DateTime!');
      expect(USER_STATS_QUERY).toContain('$to: DateTime!');
    });

    it('should export CONTRIBUTION_YEARS_QUERY', () => {
      expect(CONTRIBUTION_YEARS_QUERY).toBeTypeOf('string');
      expect(CONTRIBUTION_YEARS_QUERY).toContain('query ContributionYears');
      expect(CONTRIBUTION_YEARS_QUERY).toContain('$login: String!');
      expect(CONTRIBUTION_YEARS_QUERY).toContain('contributionYears');
    });
  });
});
