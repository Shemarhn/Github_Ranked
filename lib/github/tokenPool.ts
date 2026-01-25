/**
 * Token Pool Data Structure
 * Manages multiple GitHub Personal Access Tokens for rate limit distribution
 */

/**
 * Individual token entry in the pool.
 */
export interface TokenEntry {
	/** The GitHub Personal Access Token */
	token: string;
	/** Remaining GraphQL rate limit points (0-5000) */
	remainingPoints: number;
	/** Unix timestamp (seconds) when rate limit resets */
	resetTime: number;
	/** Unix timestamp (milliseconds) of last usage */
	lastUsed: number;
}

/**
 * Token pool containing multiple tokens with round-robin selection.
 */
export interface TokenPool {
	/** Array of token entries */
	tokens: TokenEntry[];
	/** Current index for round-robin selection (0-based) */
	currentIndex: number;
}
