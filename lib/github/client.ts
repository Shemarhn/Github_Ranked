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
				data.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;

			throw new GitHubAPIError(errorMessage, {
				statusCode: response.status,
				errors: data.errors,
			});
		}

		// Check for GraphQL errors (even with 200 status)
		if (data.errors && data.errors.length > 0) {
			const firstError = data.errors[0];
			throw new GitHubAPIError(
				firstError.message || 'GraphQL query failed',
				{
					errors: data.errors,
				}
			);
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
