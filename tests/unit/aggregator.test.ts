import { describe, expect, it, vi } from 'vitest';

import { fetchContributionYears } from '@/lib/github/aggregator';
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

    const result = await fetchContributionYears('octocat', 'ghp_test');

    expect(result).toEqual([2024, 2023, 2022]);
  });

  it('throws UserNotFoundError when user is missing', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValueOnce({
      data: {
        user: null,
      },
    });

    await expect(fetchContributionYears('missing-user', 'ghp_test')).rejects.toBeInstanceOf(
      UserNotFoundError
    );
  });
});
