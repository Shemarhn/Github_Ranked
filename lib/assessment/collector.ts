import { z } from 'zod';
import { executeGraphQLQueryWithRetry } from '@/lib/github/client';
import { TokenPoolManager } from '@/lib/github/tokenPool';
import {
  GitHubAPIError,
  UserNotFoundError,
  ValidationError,
} from '@/lib/utils/errors';
import { validateUsername } from '@/lib/utils/validation';
import type { EvidenceEvent, EvidenceSnapshot } from './types';

const repository = z.object({
  nameWithOwner: z.string(),
  isPrivate: z.boolean(),
  isFork: z.boolean(),
});
const actor = z
  .object({ login: z.string(), __typename: z.string() })
  .nullable();
const pageInfo = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable(),
});
const monthlySchema = z.object({
  user: z
    .object({
      login: z.string(),
      contributionsCollection: z.object({
        totalRepositoriesWithContributedCommits: z.number(),
        commitContributionsByRepository: z.array(
          z.object({
            repository,
            contributions: z.object({
              nodes: z.array(
                z.object({
                  occurredAt: z.string(),
                  commitCount: z.number(),
                  url: z.string(),
                })
              ),
            }),
          })
        ),
        pullRequestReviewContributions: z.object({
          pageInfo,
          nodes: z.array(
            z
              .object({
                occurredAt: z.string(),
                repository,
                pullRequest: z.object({ id: z.string(), author: actor }),
                pullRequestReview: z.object({
                  url: z.string(),
                  state: z.string(),
                  author: actor,
                }),
              })
              .nullable()
          ),
        }),
      }),
    })
    .nullable(),
});

const mergedSchema = z.object({
  search: z.object({
    pageInfo,
    nodes: z.array(
      z
        .object({
          id: z.string(),
          url: z.string(),
          mergedAt: z.string().nullable(),
          author: actor,
          repository,
        })
        .nullable()
    ),
  }),
});

export const MONTH_QUERY = `query EvidenceMonth($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    contributionsCollection(from: $from, to: $to) {
      totalRepositoriesWithContributedCommits
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner isPrivate isFork }
        contributions(first: 3) { nodes { occurredAt commitCount url } }
      }
      pullRequestReviewContributions(first: 100) {
        pageInfo { hasNextPage endCursor }
        nodes {
          occurredAt
          repository { nameWithOwner isPrivate isFork }
          pullRequest { id author { login __typename } }
          pullRequestReview { url state author { login __typename } }
        }
      }
    }
  }
  rateLimit { limit cost remaining resetAt }
}`;

export const MERGED_QUERY = `query MergedEvidence($query: String!, $after: String) {
  search(query: $query, type: ISSUE, first: 50, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { ... on PullRequest {
      id url mergedAt author { login __typename }
      repository { nameWithOwner isPrivate isFork }
    } }
  }
  rateLimit { limit cost remaining resetAt }
}`;

export function evidenceWindow(now: Date, season?: number) {
  if (!Number.isFinite(now.getTime()))
    throw new ValidationError('Invalid assessment date');
  if (
    season !== undefined &&
    (!Number.isInteger(season) ||
      season < 2010 ||
      season > now.getUTCFullYear())
  )
    throw new ValidationError('Invalid season');
  const from =
    season === undefined
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
      : new Date(Date.UTC(season, 0, 1));
  const to =
    season === undefined
      ? now
      : new Date(Math.min(now.getTime(), Date.UTC(season + 1, 0, 1) - 1));
  return { from, to };
}

/** Public-only metadata. Private identifiers never enter the returned snapshot. */
export async function collectEvidence(
  username: string,
  now = new Date(),
  season?: number
): Promise<EvidenceSnapshot> {
  if (!validateUsername(username))
    throw new ValidationError('Invalid GitHub username');
  const { from, to } = evidenceWindow(now, season);
  const pool = new TokenPoolManager();
  const request = async (query: string, variables: Record<string, unknown>) => {
    const token = pool.selectToken();
    const response = await executeGraphQLQueryWithRetry<{
      rateLimit?: { remaining: number; resetAt: string };
    }>({ query, variables }, token);
    if (response.data?.rateLimit) {
      pool.updateRateLimit(
        token,
        response.data.rateLimit.remaining,
        Date.parse(response.data.rateLimit.resetAt) / 1000
      );
    }
    return response.data;
  };
  const events: EvidenceEvent[] = [];
  const limitations = new Set<string>([
    'Only public GitHub evidence is assessed. Private work and work outside GitHub are unknown.',
    'Activity metadata does not establish correctness, design quality, or real-world impact.',
    'Commit observations follow GitHub contribution eligibility; fork-only and unattributed work may be absent.',
  ]);
  let complete = true;
  const intervals: { from: string; to: string }[] = [];
  for (
    let date = new Date(from);
    date <= to;
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  ) {
    intervals.push({
      from: date.toISOString(),
      to: new Date(
        Math.min(
          to.getTime(),
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) - 1
        )
      ).toISOString(),
    });
  }
  // Three requests at a time limits bursts and avoids unbounded per-user fanout.
  for (let offset = 0; offset < intervals.length; offset += 3) {
    const batch = await Promise.all(
      intervals.slice(offset, offset + 3).map(async (interval) => {
        const parsed = monthlySchema.safeParse(
          await request(MONTH_QUERY, { login: username, ...interval })
        );
        if (!parsed.success)
          throw new GitHubAPIError('Unexpected GitHub evidence response');
        if (!parsed.data.user) throw new UserNotFoundError(username);
        return parsed.data.user.contributionsCollection;
      })
    );
    for (const month of batch) {
      if (
        month.totalRepositoriesWithContributedCommits > 100 ||
        month.pullRequestReviewContributions.pageInfo.hasNextPage
      ) {
        complete = false;
        limitations.add(
          'A monthly collection limit was reached. A rank is withheld rather than treating missing observations as zero.'
        );
      }
      for (const group of month.commitContributionsByRepository) {
        if (group.repository.isPrivate || group.repository.isFork) continue;
        // Three distinct contribution days are sufficient to reach the monthly cap.
        for (const day of group.contributions.nodes)
          if (day.commitCount > 0)
            events.push({
              id: `${group.repository.nameWithOwner}:${day.occurredAt}`,
              kind: 'commit_day',
              repository: group.repository.nameWithOwner,
              occurredAt: day.occurredAt,
              url: day.url,
            });
      }
      for (const review of month.pullRequestReviewContributions.nodes) {
        if (
          !review ||
          review.repository.isPrivate ||
          review.repository.isFork ||
          review.pullRequest.author?.__typename !== 'User' ||
          review.pullRequestReview.author?.login.toLowerCase() !==
            username.toLowerCase() ||
          !['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(
            review.pullRequestReview.state
          )
        )
          continue;
        events.push({
          id: review.pullRequest.id,
          kind: 'review',
          repository: review.repository.nameWithOwner,
          occurredAt: review.occurredAt,
          url: review.pullRequestReview.url,
          counterpart: review.pullRequest.author.login,
        });
      }
    }
  }
  let after: string | null = null;
  const query = `is:pr is:merged is:public author:${username} merged:${from.toISOString().slice(0, 10)}..${to.toISOString().slice(0, 10)} sort:updated-desc`;
  for (let page = 0; page < 4; page++) {
    const parsed = mergedSchema.safeParse(
      await request(MERGED_QUERY, { query, after })
    );
    if (!parsed.success)
      throw new GitHubAPIError('Unexpected GitHub merged PR response');
    for (const pr of parsed.data.search.nodes) {
      if (
        !pr ||
        !pr.mergedAt ||
        pr.repository.isPrivate ||
        pr.repository.isFork ||
        pr.author?.__typename !== 'User' ||
        pr.author.login.toLowerCase() !== username.toLowerCase()
      )
        continue;
      events.push({
        id: pr.id,
        kind: 'merged_pr',
        repository: pr.repository.nameWithOwner,
        occurredAt: pr.mergedAt,
        url: pr.url,
      });
    }
    if (!parsed.data.search.pageInfo.hasNextPage) break;
    after = parsed.data.search.pageInfo.endCursor;
    if (!after || page === 3) {
      complete = false;
      limitations.add(
        'Merged PR collection was truncated; the contribution rank is withheld.'
      );
      break;
    }
  }
  return {
    username,
    from: from.toISOString(),
    to: to.toISOString(),
    fetchedAt: now.toISOString(),
    events,
    complete,
    limitations: [...limitations],
  };
}
