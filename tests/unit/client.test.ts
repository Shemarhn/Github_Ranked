/**
 * Unit Tests for GitHub GraphQL Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeGraphQLQuery,
  executeGraphQLQueryWithRetry,
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
    vi.useRealTimers();
  });

  afterEach(() => {
    // Reset mocks after each test
    vi.resetAllMocks();
    vi.useRealTimers();
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

  describe('executeGraphQLQueryWithRetry', () => {
    it('should succeed on first attempt', async () => {
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

      const result = await executeGraphQLQueryWithRetry(request, 'ghp_token');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 403 rate limit error and succeed', async () => {
      vi.useFakeTimers();

      // First attempt: 403 rate limit error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          errors: [{ message: 'API rate limit exceeded' }],
        }),
      });

      // Second attempt: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { user: { login: 'octocat' } } }),
      });

      const request = { query: 'query { }', variables: {} };

      const promise = executeGraphQLQueryWithRetry(request, 'ghp_token');

      await vi.advanceTimersByTimeAsync(0); // Initial attempt fails
      await vi.advanceTimersByTimeAsync(1000); // First retry succeeds after 1s

      const result = await promise;

      expect(result.data).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should retry on 5xx server error and succeed', async () => {
      vi.useFakeTimers();

      // First attempt: 502 server error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: async () => ({
          errors: [{ message: 'Server error' }],
        }),
      });

      // Second attempt: success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { user: { login: 'octocat' } } }),
      });

      const request = { query: 'query { }', variables: {} };

      const promise = executeGraphQLQueryWithRetry(request, 'ghp_token');

      await vi.advanceTimersByTimeAsync(0); // Initial attempt fails
      await vi.advanceTimersByTimeAsync(1000); // First retry succeeds after 1s

      const result = await promise;

      expect(result.data).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should not retry on 401 unauthorized error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          errors: [{ message: 'Bad credentials' }],
        }),
      });

      const request = { query: 'query { }', variables: {} };

      await expect(
        executeGraphQLQueryWithRetry(request, 'ghp_token')
      ).rejects.toThrow(GitHubAPIError);

      // Should only try once (no retries for 401)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 not found error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          errors: [{ message: 'Resource not found' }],
        }),
      });

      const request = { query: 'query { }', variables: {} };

      await expect(
        executeGraphQLQueryWithRetry(request, 'ghp_token')
      ).rejects.toThrow(GitHubAPIError);

      // Should only try once (no retries for 404)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry up to 3 times on 403 errors', async () => {
      vi.useFakeTimers();

      // All 4 attempts (initial + 3 retries) fail with 403
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          errors: [{ message: 'API rate limit exceeded' }],
        }),
      });

      const request = { query: 'query { }', variables: {} };

      const promise = executeGraphQLQueryWithRetry(request, 'ghp_token').catch(
        (e) => e
      );

      // Advance through all retries
      await vi.runAllTimersAsync();

      const error = await promise;

      expect(error).toBeInstanceOf(GitHubAPIError);
      expect(mockFetch).toHaveBeenCalledTimes(4);

      vi.useRealTimers();
    });

    it('should use exponential backoff delays', async () => {
      vi.useFakeTimers();

      // All attempts fail with 503
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
          errors: [{ message: 'Service unavailable' }],
        }),
      });

      const request = { query: 'query { }', variables: {} };

      // Start the retry attempt
      const promise = executeGraphQLQueryWithRetry(request, 'ghp_token').catch(
        (e) => e
      );

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second attempt after 1 second
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Third attempt after 2 seconds
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Fourth attempt after 4 seconds
      await vi.advanceTimersByTimeAsync(4000);
      expect(mockFetch).toHaveBeenCalledTimes(4);

      // Should reject after all retries exhausted
      const error = await promise;
      expect(error).toBeInstanceOf(GitHubAPIError);

      vi.useRealTimers();
    });

    it('should succeed on third retry', async () => {
      vi.useFakeTimers();

      // First two attempts fail
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ errors: [{ message: 'Service unavailable' }] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ errors: [{ message: 'Service unavailable' }] }),
      });

      // Third attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { user: { login: 'octocat' } } }),
      });

      const request = { query: 'query { }', variables: {} };

      const promise = executeGraphQLQueryWithRetry(request, 'ghp_token');

      // Advance through retries
      await vi.advanceTimersByTimeAsync(0); // Initial attempt fails
      await vi.advanceTimersByTimeAsync(1000); // First retry fails after 1s
      await vi.advanceTimersByTimeAsync(2000); // Second retry succeeds after 2s

      const result = await promise;

      expect(result.data).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });
});
