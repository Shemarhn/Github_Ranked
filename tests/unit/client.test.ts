/**
 * Unit Tests for GitHub GraphQL Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	executeGraphQLQuery,
	parseRateLimitFromResponse,
	parseRateLimitFromHeaders,
} from '@/lib/github/client';
import { GitHubAPIError } from '@/lib/utils/errors';
import type { GraphQLResponse } from '@/lib/github/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('GitHub GraphQL Client', () => {
	beforeEach(() => {
		// Clear mocks before each test
		mockFetch.mockClear();
	});

	afterEach(() => {
		// Reset mocks after each test
		vi.resetAllMocks();
	});

	describe('executeGraphQLQuery', () => {
		it('should successfully execute a query', async () => {
			const mockResponse: GraphQLResponse<{ user: { login: string } }> = {
				data: {
					user: { login: 'octocat' },
				},
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockResponse,
			});

			const request = {
				query: 'query { user { login } }',
				variables: {},
			};

			const result = await executeGraphQLQuery(request, 'ghp_test_token');

			expect(result).toEqual(mockResponse);
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.github.com/graphql',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer ghp_test_token',
					}),
					body: JSON.stringify(request),
				})
			);
		});

		it('should include User-Agent header', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: {} }),
			});

			await executeGraphQLQuery(
				{ query: 'query { }', variables: {} },
				'ghp_token'
			);

			const fetchCall = mockFetch.mock.calls[0];
			const headers = fetchCall[1]?.headers as Record<string, string>;

			expect(headers['User-Agent']).toBe('GitHub-Ranked/1.0');
		});

		it('should throw GitHubAPIError on HTTP error', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({
					errors: [{ message: 'Resource not found' }],
				}),
			});

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow(GitHubAPIError);

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow('Resource not found');
		});

		it('should throw GitHubAPIError on GraphQL errors', async () => {
			const mockResponse = {
				data: null,
				errors: [
					{
						message: 'Field "invalid" does not exist',
						locations: [{ line: 1, column: 1 }],
					},
				],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => mockResponse,
			});

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow(GitHubAPIError);

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow('Field "invalid" does not exist');
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow(GitHubAPIError);

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow('GitHub API request failed: Network error');
		});

		it('should handle rate limit errors (403)', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 403,
				statusText: 'Forbidden',
				json: async () => ({
					errors: [{ message: 'API rate limit exceeded' }],
				}),
			});

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow(GitHubAPIError);

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow('API rate limit exceeded');
		});

		it('should handle unauthorized errors (401)', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				statusText: 'Unauthorized',
				json: async () => ({
					errors: [{ message: 'Bad credentials' }],
				}),
			});

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_invalid_token')
			).rejects.toThrow(GitHubAPIError);

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_invalid_token')
			).rejects.toThrow('Bad credentials');
		});

		it('should handle server errors (5xx)', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 502,
				statusText: 'Bad Gateway',
				json: async () => ({
					errors: [{ message: 'Server error' }],
				}),
			});

			await expect(
				executeGraphQLQuery({ query: '', variables: {} }, 'ghp_token')
			).rejects.toThrow(GitHubAPIError);
		});

		it('should pass variables correctly', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: {} }),
			});

			const request = {
				query: 'query($login: String!) { user(login: $login) { login } }',
				variables: { login: 'octocat' },
			};

			await executeGraphQLQuery(request, 'ghp_token');

			const fetchCall = mockFetch.mock.calls[0];
			const body = JSON.parse(fetchCall[1]?.body as string);

			expect(body.variables).toEqual({ login: 'octocat' });
		});
	});

	describe('parseRateLimitFromResponse', () => {
		it('should parse rate limit from successful response', () => {
			const response: GraphQLResponse<unknown> = {
				data: {
					user: {},
					rateLimit: {
						limit: 5000,
						cost: 1,
						remaining: 4999,
						resetAt: '2024-01-01T00:00:00Z',
					},
				},
			};

			const rateLimit = parseRateLimitFromResponse(response);

			expect(rateLimit).toEqual({
				limit: 5000,
				cost: 1,
				remaining: 4999,
				resetAt: '2024-01-01T00:00:00Z',
			});
		});

		it('should return null if rateLimit not present', () => {
			const response: GraphQLResponse<unknown> = {
				data: {
					user: {},
				},
			};

			const rateLimit = parseRateLimitFromResponse(response);
			expect(rateLimit).toBeNull();
		});

		it('should return null if data is null', () => {
			const response: GraphQLResponse<unknown> = {
				data: null,
			};

			const rateLimit = parseRateLimitFromResponse(response);
			expect(rateLimit).toBeNull();
		});

		it('should return null if rateLimit fields are invalid', () => {
			const response: GraphQLResponse<unknown> = {
				data: {
					rateLimit: {
						limit: 'invalid', // Should be number
						cost: 1,
						remaining: 4999,
						resetAt: '2024-01-01T00:00:00Z',
					},
				},
			};

			const rateLimit = parseRateLimitFromResponse(response);
			expect(rateLimit).toBeNull();
		});
	});

	describe('parseRateLimitFromHeaders', () => {
		it('should parse rate limit from headers', () => {
			const headers = new Headers({
				'X-RateLimit-Remaining': '4999',
				'X-RateLimit-Reset': '1704067200',
			});

			const rateLimit = parseRateLimitFromHeaders(headers);

			expect(rateLimit).toEqual({
				remaining: 4999,
				resetTime: 1704067200,
			});
		});

		it('should return null if headers not present', () => {
			const headers = new Headers();

			const rateLimit = parseRateLimitFromHeaders(headers);
			expect(rateLimit).toBeNull();
		});

		it('should return null if only remaining header present', () => {
			const headers = new Headers({
				'X-RateLimit-Remaining': '4999',
			});

			const rateLimit = parseRateLimitFromHeaders(headers);
			expect(rateLimit).toBeNull();
		});

		it('should return null if only reset header present', () => {
			const headers = new Headers({
				'X-RateLimit-Reset': '1704067200',
			});

			const rateLimit = parseRateLimitFromHeaders(headers);
			expect(rateLimit).toBeNull();
		});
	});
});
