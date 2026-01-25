/**
 * GitHub Data Aggregator
 * Fetches and aggregates GitHub contribution statistics
 */

import { UserNotFoundError } from '@/lib/utils/errors';
import { TokenPoolManager } from './tokenPool';
import { buildContributionYearsQuery } from './queries';
import {
  executeGraphQLQueryWithRetry,
  parseRateLimitFromResponse,
} from './client';
import type { GraphQLResponse, RateLimitInfo } from './types';

interface ContributionYearsResponse {
  user: {
    contributionsCollection: {
      contributionYears?: number[];
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

const resolveToken = (token?: string): { token: string; useTokenPool: boolean } => {
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
  const response = await executeGraphQLQueryWithRetry<ContributionYearsResponse>(
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
