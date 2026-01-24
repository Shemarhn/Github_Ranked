import { describe, expect, it } from 'vitest';

import {
  ApiError,
  formatErrorResponse,
  GitHubAPIError,
  RateLimitError,
  UserNotFoundError,
  ValidationError,
} from '../../lib/utils/errors';

describe('error formatting', () => {
  it('formats validation errors', () => {
    const error = new ValidationError('Invalid input', { field: 'username' });
    const result = formatErrorResponse(error, 'req_test');

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('ValidationError');
    expect(result.body.code).toBe(400);
    expect(result.body.requestId).toBe('req_test');
  });

  it('formats user not found errors', () => {
    const error = new UserNotFoundError('octocat');
    const result = formatErrorResponse(error, 'req_missing');

    expect(result.status).toBe(404);
    expect(result.body.error).toBe('UserNotFound');
  });

  it('formats rate limit errors with retryAfter', () => {
    const error = new RateLimitError('Too many requests', 3600);
    const result = formatErrorResponse(error, 'req_rate');

    expect(result.status).toBe(429);
    expect(result.body.retryAfter).toBe(3600);
  });

  it('formats GitHub API errors', () => {
    const error = new GitHubAPIError('GitHub unavailable');
    const result = formatErrorResponse(error, 'req_github');

    expect(result.status).toBe(502);
    expect(result.body.error).toBe('GitHubAPIError');
  });

  it('formats unknown errors as internal error', () => {
    const result = formatErrorResponse(new Error('boom'), 'req_internal');

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('InternalError');
  });

  it('formats generic ApiError subclasses', () => {
    const error = new ApiError('CustomError', 'Custom message', 418);
    const result = formatErrorResponse(error, 'req_custom');

    expect(result.status).toBe(418);
    expect(result.body.error).toBe('CustomError');
  });
});
