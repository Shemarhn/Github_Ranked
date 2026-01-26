/**
 * GitHub GraphQL API Client
 * Edge Runtime compatible implementation using fetch API
 */

import type { GraphQLRequest } from './queries';
import type { GraphQLResponse, RateLimitInfo } from './types';
import { GitHubAPIError } from '@/lib/utils/errors';

/**
 * GitHub GraphQL API endpoint
 */
const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

/**
 * Execute a GraphQL query against the GitHub API.
 *
 * @param request - GraphQL request with query and variables
 * @param token - GitHub Personal Access Token
 * @returns Promise resolving to the GraphQL response
 * @throws GitHubAPIError if the request fails
 */
export async function executeGraphQLQuery<T = unknown>(
  request: GraphQLRequest,
  token: string
): Promise<GraphQLResponse<T>> {
  try {
    // Send POST request to GitHub GraphQL API
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'GitHub-Ranked/1.0',
      },
      body: JSON.stringify(request),
    });

    // Parse response body
    const data = (await response.json()) as GraphQLResponse<T>;

    // Check for HTTP errors (non-200 status codes)
    if (!response.ok) {
      // Extract error message from response
      const errorMessage =
        data.errors?.[0]?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      throw new GitHubAPIError(errorMessage, {
        statusCode: response.status,
        errors: data.errors,
      });
    }

    // Check for GraphQL errors (even with 200 status)
    if (data.errors && data.errors.length > 0) {
      const firstError = data.errors[0];
      throw new GitHubAPIError(firstError.message || 'GraphQL query failed', {
        errors: data.errors,
      });
    }

    // Return successful response
    return data;
  } catch (error) {
    // Handle fetch errors (network issues, timeouts, etc.)
    if (error instanceof GitHubAPIError) {
      throw error; // Re-throw our custom errors
    }

    // Wrap unknown errors
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new GitHubAPIError(`GitHub API request failed: ${message}`, {
      originalError: error,
    });
  }
}

/**
 * Parse rate limit information from GraphQL response.
 *
 * @param response - GraphQL response containing rate limit data
 * @returns Rate limit information, or null if not present
 */
export function parseRateLimitFromResponse(
  response: GraphQLResponse<unknown>
): RateLimitInfo | null {
  if (!response.data || typeof response.data !== 'object') {
    return null;
  }

  const data = response.data as Record<string, unknown>;
  const rateLimit = data.rateLimit;

  if (!rateLimit || typeof rateLimit !== 'object') {
    return null;
  }

  const limit = rateLimit as Record<string, unknown>;

  // Validate all required fields are present
  if (
    typeof limit.limit !== 'number' ||
    typeof limit.cost !== 'number' ||
    typeof limit.remaining !== 'number' ||
    typeof limit.resetAt !== 'string'
  ) {
    return null;
  }

  return {
    limit: limit.limit,
    cost: limit.cost,
    remaining: limit.remaining,
    resetAt: limit.resetAt,
  };
}

/**
 * Parse rate limit information from response headers.
 * Fallback for REST API or when GraphQL rate limit data is unavailable.
 *
 * @param headers - Response headers from fetch
 * @returns Object with remaining and resetTime, or null if headers not present
 */
export function parseRateLimitFromHeaders(
  headers: Headers
): { remaining: number; resetTime: number } | null {
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (!remaining || !reset) {
    return null;
  }

  return {
    remaining: parseInt(remaining, 10),
    resetTime: parseInt(reset, 10), // Unix timestamp in seconds
  };
}

/**
 * Check if an error should trigger a retry.
 * Retries on rate limit errors (403) and server errors (5xx).
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof GitHubAPIError)) {
    return false;
  }

  const statusCode = error.details?.statusCode as number | undefined;
  if (!statusCode) {
    return false;
  }

  // Retry on rate limit (403) and server errors (5xx)
  return statusCode === 403 || (statusCode >= 500 && statusCode < 600);
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Milliseconds to sleep
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a GraphQL query with automatic retry on transient errors.
 * Uses exponential backoff: 1s, 2s, 4s (max 3 retries).
 *
 * @param request - GraphQL request with query and variables
 * @param token - GitHub Personal Access Token
 * @returns Promise resolving to the GraphQL response
 * @throws GitHubAPIError if all retries fail
 */
export async function executeGraphQLQueryWithRetry<T = unknown>(
  request: GraphQLRequest,
  token: string
): Promise<GraphQLResponse<T>> {
  let lastError: GitHubAPIError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Attempt the request
      return await executeGraphQLQuery<T>(request, token);
    } catch (error) {
      // Check if we should retry
      if (
        error instanceof GitHubAPIError &&
        isRetryableError(error) &&
        attempt < MAX_RETRIES
      ) {
        lastError = error;

        // Wait with exponential backoff before retrying
        const delayMs = RETRY_DELAYS[attempt];
        await sleep(delayMs);

        // Continue to next retry attempt
        continue;
      }

      // Non-retryable error or out of retries, throw immediately
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new GitHubAPIError('Maximum retries exceeded');
}
