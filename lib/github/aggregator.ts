/**
 * GitHub Data Aggregator
 * Fetches and aggregates GitHub contribution statistics
 */

import { GitHubAPIError, UserNotFoundError } from '@/lib/utils/errors';
import { TokenPoolManager } from './tokenPool';
import {
  buildContributionYearsQuery,
  buildUserStatsQuery,
  getYearDates,
} from './queries';
import {
  executeGraphQLQueryWithRetry,
  parseRateLimitFromResponse,
} from './client';
import type {
  AggregatedStats,
  GraphQLResponse,
  RateLimitInfo,
  YearlyStats,
} from './types';

interface ContributionYearsResponse {
  user: {
    contributionsCollection: {
      contributionYears?: number[];
    };
  } | null;
  rateLimit?: RateLimitInfo;
}

interface UserStatsResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalIssueContributions: number;
      restrictedContributionsCount: number;
    };
  } | null;
  rateLimit?: RateLimitInfo;
}

interface UserMetaResponse {
  user: {
    followers: {
      totalCount: number;
    };
    repositories: {
      nodes: Array<{
        stargazers: {
          totalCount: number;
        };
      }>;
    };
  } | null;
  rateLimit?: RateLimitInfo;
}

let tokenPool: TokenPoolManager | null = null;

const getTokenPool = (): TokenPoolManager => {
  if (!tokenPool) {
    tokenPool = new TokenPoolManager();
  }

  return tokenPool;
};

const applyRateLimitUpdate = (
  response: GraphQLResponse<unknown>,
  token: string,
  useTokenPool: boolean
): void => {
  if (!useTokenPool) {
    return;
  }

  const rateLimit = parseRateLimitFromResponse(response);
  if (!rateLimit) {
    return;
  }

  const resetTime = Math.floor(new Date(rateLimit.resetAt).getTime() / 1000);
  if (!Number.isFinite(resetTime)) {
    return;
  }

  const pool = getTokenPool();
  pool.updateRateLimit(token, rateLimit.remaining, resetTime);
  pool.recordUsage(token, Math.max(rateLimit.cost, 1));
};

const resolveToken = (
  token?: string
): { token: string; useTokenPool: boolean } => {
  if (token) {
    return { token, useTokenPool: false };
  }

  const pool = getTokenPool();
  return { token: pool.selectToken(), useTokenPool: true };
};

/**
 * Fetch the list of contribution years for a GitHub user.
 *
 * @param username - GitHub username
 * @param token - Optional GitHub Personal Access Token
 * @returns Array of years with contributions
 * @throws UserNotFoundError if user does not exist
 */
export async function fetchContributionYears(
  username: string,
  token?: string
): Promise<number[]> {
  const resolved = resolveToken(token);
  const request = buildContributionYearsQuery(username);
  const response =
    await executeGraphQLQueryWithRetry<ContributionYearsResponse>(
      request,
      resolved.token
    );

  applyRateLimitUpdate(response, resolved.token, resolved.useTokenPool);

  const data = response.data;
  if (!data?.user) {
    throw new UserNotFoundError(username);
  }

  return data.user.contributionsCollection.contributionYears ?? [];
}

/**
 * Fetch contribution statistics for a specific year.
 *
 * @param username - GitHub username
 * @param year - Contribution year (UTC)
 * @param token - Optional GitHub Personal Access Token
 * @returns YearlyStats for the requested year
 * @throws UserNotFoundError if user does not exist
 */
export async function fetchYearlyStats(
  username: string,
  year: number,
  token?: string
): Promise<YearlyStats> {
  const { from, to } = getYearDates(year);
  const resolved = resolveToken(token);
  const request = buildUserStatsQuery(username, from, to);
  const response = await executeGraphQLQueryWithRetry<UserStatsResponse>(
    request,
    resolved.token
  );

  applyRateLimitUpdate(response, resolved.token, resolved.useTokenPool);

  const data = response.data;
  if (!data?.user) {
    throw new UserNotFoundError(username);
  }

  const collection = data.user.contributionsCollection;

  return {
    year,
    commits: collection.totalCommitContributions,
    prs: collection.totalPullRequestContributions,
    reviews: collection.totalPullRequestReviewContributions,
    issues: collection.totalIssueContributions,
    privateContributions: collection.restrictedContributionsCount,
  };
}

export interface YearlyStatsBatchResult {
  stats: YearlyStats[];
  failedYears: number[];
}

type StargazerNode = { stargazers: { totalCount: number } };

const sumStars = (nodes: StargazerNode[]): number =>
  nodes.reduce((total, node) => total + node.stargazers.totalCount, 0);

const getCurrentYear = (): number => new Date().getUTCFullYear();

const fetchUserMeta = async (
  username: string,
  token?: string
): Promise<{ totalStars: number; totalFollowers: number }> => {
  const currentYear = getCurrentYear();
  const { from, to } = getYearDates(currentYear);
  const resolved = resolveToken(token);
  const request = buildUserStatsQuery(username, from, to);
  const response = await executeGraphQLQueryWithRetry<UserMetaResponse>(
    request,
    resolved.token
  );

  applyRateLimitUpdate(response, resolved.token, resolved.useTokenPool);

  const data = response.data;
  if (!data?.user) {
    throw new UserNotFoundError(username);
  }

  return {
    totalStars: sumStars(data.user.repositories.nodes),
    totalFollowers: data.user.followers.totalCount,
  };
};

/**
 * Fetch yearly stats for multiple years in parallel.
 *
 * @param username - GitHub username
 * @param years - List of years to fetch
 * @param token - Optional GitHub Personal Access Token
 * @returns Batch result with successful stats and failed years
 */
export async function fetchYearlyStatsForYears(
  username: string,
  years: number[],
  token?: string
): Promise<YearlyStatsBatchResult> {
  if (years.length === 0) {
    return { stats: [], failedYears: [] };
  }

  const results = await Promise.all(
    years.map(async (year) => {
      try {
        const stats = await fetchYearlyStats(username, year, token);
        return { status: 'fulfilled' as const, year, value: stats };
      } catch (error) {
        return { status: 'rejected' as const, year, reason: error };
      }
    })
  );

  const failedYears = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.year);

  const userNotFound = results.find(
    (result) =>
      result.status === 'rejected' && result.reason instanceof UserNotFoundError
  );

  if (userNotFound) {
    throw userNotFound.reason;
  }

  const stats = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  if (stats.length === 0) {
    throw new GitHubAPIError(
      'Failed to fetch yearly stats for all requested years',
      {
        years,
      }
    );
  }

  return { stats, failedYears };
}

/**
 * Aggregate all-time GitHub stats across all contribution years.
 *
 * @param username - GitHub username
 * @param token - Optional GitHub Personal Access Token
 * @returns AggregatedStats object
 * @throws UserNotFoundError if user does not exist
 */
export async function aggregateAllTimeStats(
  username: string,
  token?: string
): Promise<AggregatedStats> {
  const years = await fetchContributionYears(username, token);
  const { totalStars, totalFollowers } = await fetchUserMeta(username, token);

  if (years.length === 0) {
    const currentYear = getCurrentYear();
    return {
      totalCommits: 0,
      totalMergedPRs: 0,
      totalCodeReviews: 0,
      totalIssuesClosed: 0,
      totalStars,
      totalFollowers,
      firstContributionYear: currentYear,
      lastContributionYear: currentYear,
      yearsActive: 0,
    };
  }

  const { stats } = await fetchYearlyStatsForYears(username, years, token);

  const totals = stats.reduce(
    (acc, year) => ({
      commits: acc.commits + year.commits,
      prs: acc.prs + year.prs,
      reviews: acc.reviews + year.reviews,
      issues: acc.issues + year.issues,
    }),
    { commits: 0, prs: 0, reviews: 0, issues: 0 }
  );

  const sortedYears = stats.map((stat) => stat.year).sort((a, b) => a - b);

  return {
    totalCommits: totals.commits,
    totalMergedPRs: totals.prs,
    totalCodeReviews: totals.reviews,
    totalIssuesClosed: totals.issues,
    totalStars,
    totalFollowers,
    firstContributionYear: sortedYears[0],
    lastContributionYear: sortedYears[sortedYears.length - 1],
    yearsActive: sortedYears.length,
  };
}

/**
 * Fetch contribution statistics for a specific year.
 *
 * @param username - GitHub username
 * @param year - Contribution year (UTC)
 * @param token - Optional GitHub Personal Access Token
 * @returns YearlyStats for the requested year
 * @throws UserNotFoundError if user does not exist
 */
