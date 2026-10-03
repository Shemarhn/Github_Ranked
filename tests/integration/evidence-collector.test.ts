import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  collectEvidence,
  MERGED_QUERY,
  MONTH_QUERY,
} from '@/lib/assessment/collector';
import { executeGraphQLQueryWithRetry } from '@/lib/github/client';
import { GitHubAPIError, UserNotFoundError } from '@/lib/utils/errors';

vi.mock('@/lib/github/client', () => ({
  executeGraphQLQueryWithRetry: vi.fn(),
}));
const now = new Date('2026-01-31T12:00:00Z');
const repo = { nameWithOwner: 'dev/project', isPrivate: false, isFork: false };
const actor = { login: 'dev', __typename: 'User' };
const pageInfo = { hasNextPage: false, endCursor: null };
const monthly = () => ({
  user: {
    login: 'dev',
    contributionsCollection: {
      totalRepositoriesWithContributedCommits: 1,
      commitContributionsByRepository: [
        {
          repository: repo,
          contributions: {
            nodes: [
              {
                occurredAt: '2026-01-01T12:00:00Z',
                commitCount: 500,
                url: 'https://github.com/dev/project/commits',
              },
            ],
          },
        },
      ],
      pullRequestReviewContributions: {
        pageInfo,
        nodes: [
          {
            occurredAt: '2026-01-02T12:00:00Z',
            repository: repo,
            pullRequest: {
              id: 'reviewed-pr',
              author: { login: 'peer', __typename: 'User' },
            },
            pullRequestReview: {
              url: 'https://github.com/dev/project/pull/2#review',
              state: 'APPROVED',
              author: actor,
            },
          },
        ],
      },
    },
  },
});
const merged = () => ({
  search: {
    pageInfo,
    nodes: [
      {
        id: 'merged-pr',
        url: 'https://github.com/dev/project/pull/1',
        mergedAt: '2026-01-03T12:00:00Z',
        author: actor,
        repository: repo,
      },
    ],
  },
});

describe('GitHub evidence collection', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN_1', 'test-only-token');
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(
      async ({ query }) => ({
        data: (query === MONTH_QUERY ? monthly() : merged()) as never,
      })
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it('uses actual merge timestamps and public commit days, not total opened PRs or raw commit counts', async () => {
    const result = await collectEvidence('dev', now, 2026);
    expect(result.events.map((e) => e.kind)).toEqual([
      'commit_day',
      'review',
      'merged_pr',
    ]);
    expect(result.events.find((e) => e.kind === 'merged_pr')?.occurredAt).toBe(
      '2026-01-03T12:00:00Z'
    );
    expect(result.complete).toBe(true);
    expect(executeGraphQLQueryWithRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        query: MERGED_QUERY,
        variables: expect.objectContaining({
          query: expect.stringContaining(
            'is:merged is:public author:dev merged:2026-01-01..2026-01-31'
          ),
        }),
      }),
      'test-only-token'
    );
    expect(MONTH_QUERY).not.toContain('totalIssueContributions');
  });
  it('does not leak private repository identifiers even when the server token can see them', async () => {
    const data = monthly();
    data.user.contributionsCollection.commitContributionsByRepository[0].repository =
      { ...repo, nameWithOwner: 'secret/repo', isPrivate: true };
    data.user.contributionsCollection.pullRequestReviewContributions.nodes[0].repository =
      { ...repo, nameWithOwner: 'secret/repo', isPrivate: true };
    const prs = merged();
    prs.search.nodes[0].repository = {
      ...repo,
      nameWithOwner: 'secret/repo',
      isPrivate: true,
    };
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(
      async ({ query }) => ({
        data: (query === MONTH_QUERY ? data : prs) as never,
      })
    );
    expect(
      JSON.stringify(await collectEvidence('dev', now, 2026))
    ).not.toContain('secret/repo');
    expect((await collectEvidence('dev', now, 2026)).events).toEqual([]);
  });
  it('rejects bot reviews and dismissed reviews', async () => {
    const data = monthly();
    data.user.contributionsCollection.pullRequestReviewContributions.nodes[0].pullRequestReview.state =
      'DISMISSED';
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(
      async ({ query }) => ({
        data: (query === MONTH_QUERY ? data : merged()) as never,
      })
    );
    expect(
      (await collectEvidence('dev', now, 2026)).events.some(
        (e) => e.kind === 'review'
      )
    ).toBe(false);
  });
  it('paginates merged PRs and marks a capped collection incomplete', async () => {
    const prs = merged();
    prs.search.pageInfo = { hasNextPage: true, endCursor: 'cursor' } as never;
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(
      async ({ query }) => ({
        data: (query === MONTH_QUERY ? monthly() : prs) as never,
      })
    );
    const result = await collectEvidence('dev', now, 2026);
    expect(result.complete).toBe(false);
    expect(
      vi
        .mocked(executeGraphQLQueryWithRetry)
        .mock.calls.filter(([r]) => r.query === MERGED_QUERY)
    ).toHaveLength(4);
  });
  it('marks monthly overflow incomplete', async () => {
    const data = monthly();
    data.user.contributionsCollection.pullRequestReviewContributions.pageInfo =
      { hasNextPage: true, endCursor: 'more' } as never;
    vi.mocked(executeGraphQLQueryWithRetry).mockImplementation(
      async ({ query }) => ({
        data: (query === MONTH_QUERY ? data : merged()) as never,
      })
    );
    expect((await collectEvidence('dev', now, 2026)).complete).toBe(false);
  });
  it('propagates upstream failures rather than producing a fabricated low rank', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockRejectedValue(
      new GitHubAPIError('Unavailable')
    );
    await expect(collectEvidence('dev', now, 2026)).rejects.toThrow(
      'Unavailable'
    );
  });
  it('handles missing users and changed response schemas', async () => {
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValue({
      data: { user: null },
    });
    await expect(collectEvidence('dev', now, 2026)).rejects.toBeInstanceOf(
      UserNotFoundError
    );
    vi.mocked(executeGraphQLQueryWithRetry).mockResolvedValue({ data: {} });
    await expect(collectEvidence('dev', now, 2026)).rejects.toThrow(
      'Unexpected GitHub evidence response'
    );
  });
  it('validates inputs before constructing search queries', async () => {
    await expect(
      collectEvidence('dev is:private', now, 2026)
    ).rejects.toThrow();
    expect(executeGraphQLQueryWithRetry).not.toHaveBeenCalled();
  });
});
