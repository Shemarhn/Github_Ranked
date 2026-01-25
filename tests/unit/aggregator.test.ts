import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as aggregator from '@/lib/github/aggregator';
import { UserNotFoundError } from '@/lib/utils/errors';

vi.mock('@/lib/github/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/github/client')>(
    '@/lib/github/client'
  );

  return {
    ...actual,
    executeGraphQLQueryWithRetry: vi.fn(),
  };
});

const { executeGraphQLQueryWithRetry } = await import('@/lib/github/client');

describe('GitHub aggregator', () => {
  beforeEach(() => {
    vi.mocked(executeGraphQLQueryWithRetry).mockReset();
  });

  it('fetches contribution years for a user', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValueOnce({
      data: {
        user: {
          contributionsCollection: {
            contributionYears: [2024, 2023, 2022],
          },
        },
      },
    });

    const result = await aggregator.fetchContributionYears('octocat', 'ghp_test');

    expect(result).toEqual([2024, 2023, 2022]);
  });

  it('throws UserNotFoundError when user is missing', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValueOnce({
      data: {
        user: null,
      },
    });

    await expect(
      aggregator.fetchContributionYears('missing-user', 'ghp_test')
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('fetches yearly contribution stats', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValueOnce({
      data: {
        user: {
          contributionsCollection: {
            totalCommitContributions: 120,
            totalPullRequestContributions: 15,
            totalPullRequestReviewContributions: 8,
            totalIssueContributions: 6,
            restrictedContributionsCount: 2,
          },
        },
      },
    });

    const result = await aggregator.fetchYearlyStats('octocat', 2024, 'ghp_test');

    expect(result).toEqual({
      year: 2024,
      commits: 120,
      prs: 15,
      reviews: 8,
      issues: 6,
      privateContributions: 2,
    });
  });

  it('fetches yearly stats in parallel with partial failures', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(async (request) => {
      const variables = request.variables as { from?: string };
      const from = variables.from ?? '';

      if (from.startsWith('2023')) {
        throw new Error('Network error');
      }

      return {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 10,
              totalPullRequestContributions: 2,
              totalPullRequestReviewContributions: 1,
              totalIssueContributions: 1,
              restrictedContributionsCount: 0,
            },
          },
        },
      };
    });

    const result = await aggregator.fetchYearlyStatsForYears(
      'octocat',
      [2024, 2023],
      'ghp_test'
    );

    expect(result.stats).toHaveLength(1);
    expect(result.failedYears).toEqual([2023]);
  });

  it('fails batch when user is not found', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValue({
      data: {
        user: null,
      },
    });

    await expect(
      aggregator.fetchYearlyStatsForYears('ghost', [2024], 'ghp_test')
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('completes parallel fetch within single delay window', async () => {
    vi.useFakeTimers();

    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        data: {
          user: {
            contributionsCollection: {
              totalCommitContributions: 1,
              totalPullRequestContributions: 1,
              totalPullRequestReviewContributions: 1,
              totalIssueContributions: 1,
              restrictedContributionsCount: 0,
            },
          },
        },
      };
    });

    const promise = aggregator.fetchYearlyStatsForYears(
      'octocat',
      [2024, 2023],
      'ghp_test'
    );

    await vi.advanceTimersByTimeAsync(50);
    const result = await promise;

    expect(result.stats).toHaveLength(2);
    vi.useRealTimers();
  });
});
