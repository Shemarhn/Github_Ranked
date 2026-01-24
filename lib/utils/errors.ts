/**
 * Custom Error Classes and Error Formatting
 */

export interface ErrorResponseBody {
	error: string;
	code: number;
	message: string;
	details?: Record<string, unknown>;
	requestId: string;
	retryAfter?: number;
}

const createRequestId = (): string => {
	const uuid = globalThis.crypto?.randomUUID?.();
	if (uuid) {
		return uuid;
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `req_${random}`;
};

/**
 * Base class for API-related errors.
 */
export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly details?: Record<string, unknown>;

	constructor(
		name: string,
		message: string,
		statusCode: number,
		details?: Record<string, unknown>
	) {
		super(message);
		this.name = name;
		this.statusCode = statusCode;
		this.details = details;
	}
}

/**
 * Validation error (400).
 */
export class ValidationError extends ApiError {
	constructor(message = 'Validation failed', details?: Record<string, unknown>) {
		super('ValidationError', message, 400, details);
	}
}

/**
 * User not found error (404).
 */
export class UserNotFoundError extends ApiError {
	constructor(username: string, details?: Record<string, unknown>) {
		super('UserNotFound', `User not found: ${username}`, 404, {
			username,
			...details,
		});
	}
}

/**
 * Rate limit error (429).
 */
export class RateLimitError extends ApiError {
	public readonly retryAfter?: number;

	constructor(
		message = 'Rate limit exceeded',
		retryAfter?: number,
		details?: Record<string, unknown>
	) {
		super('RateLimitExceeded', message, 429, details);
		this.retryAfter = retryAfter;
	}
}

/**
 * GitHub API error (502 by default).
 */
export class GitHubAPIError extends ApiError {
	constructor(message = 'GitHub API error', details?: Record<string, unknown>) {
		super('GitHubAPIError', message, 502, details);
	}
}

/**
 * Format an error into API response shape.
 */
export function formatErrorResponse(
	error: unknown,
	requestId?: string
): { status: number; body: ErrorResponseBody } {
	const resolvedRequestId = requestId ?? createRequestId();

	if (error instanceof ApiError) {
		const response: ErrorResponseBody = {
			error: error.name,
			code: error.statusCode,
			message: error.message,
			details: error.details,
			requestId: resolvedRequestId,
		};

		if (error instanceof RateLimitError && error.retryAfter) {
			response.retryAfter = error.retryAfter;
		}

		return { status: error.statusCode, body: response };
	}

	const fallback: ErrorResponseBody = {
		error: 'InternalError',
		code: 500,
		message: 'Internal server error',
		requestId: resolvedRequestId,
	};

	return { status: 500, body: fallback };
}
