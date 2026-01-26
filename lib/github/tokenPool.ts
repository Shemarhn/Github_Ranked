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

/**
 * Manages a pool of GitHub Personal Access Tokens with round-robin selection
 * and rate limit tracking.
 */
export class TokenPoolManager {
  private pool: TokenPool;

  constructor() {
    this.pool = {
      tokens: [],
      currentIndex: 0,
    };
    this.refreshPool();
  }

  /**
   * Refresh token pool from environment variables.
   * Loads all GITHUB_TOKEN_* environment variables.
   */
  refreshPool(): void {
    const tokens: TokenEntry[] = [];

    // Load tokens from environment variables (GITHUB_TOKEN_1, GITHUB_TOKEN_2, etc.)
    let index = 1;
    while (true) {
      const token = process.env[`GITHUB_TOKEN_${index}`];
      if (!token) {
        break;
      }

      tokens.push({
        token,
        remainingPoints: 5000, // GitHub GraphQL default
        resetTime: 0, // Will be set after first request
        lastUsed: 0,
      });

      index++;
    }

    if (tokens.length === 0) {
      throw new Error(
        'No GitHub tokens found in environment variables. Please set GITHUB_TOKEN_1, GITHUB_TOKEN_2, etc.'
      );
    }

    this.pool.tokens = tokens;
    this.pool.currentIndex = 0;
  }

  /**
   * Select next available token using round-robin strategy.
   * Skips tokens that are rate-limited.
   * @returns The selected token
   * @throws Error if all tokens are rate-limited
   */
  selectToken(): string {
    const totalTokens = this.pool.tokens.length;
    let attempts = 0;

    // Try each token in round-robin fashion
    while (attempts < totalTokens) {
      const tokenEntry = this.pool.tokens[this.pool.currentIndex];

      // Move to next token for next call
      this.pool.currentIndex = (this.pool.currentIndex + 1) % totalTokens;
      attempts++;

      // Check if token is available
      if (this.isTokenAvailable(tokenEntry.token)) {
        // Update last used time
        tokenEntry.lastUsed = Date.now();
        return tokenEntry.token;
      }
    }

    // All tokens are rate-limited
    throw new Error(
      'All GitHub tokens are rate-limited. Please try again later.'
    );
  }

  /**
   * Check if a token is available (not rate-limited).
   * @param token The token to check
   * @returns True if token is available, false if rate-limited
   */
  isTokenAvailable(token: string): boolean {
    const tokenEntry = this.pool.tokens.find((t) => t.token === token);
    if (!tokenEntry) {
      return false;
    }

    // If no points remaining, check if reset time has passed
    if (tokenEntry.remainingPoints <= 0) {
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (currentTime >= tokenEntry.resetTime) {
        // Reset time has passed, token is available again
        tokenEntry.remainingPoints = 5000;
        return true;
      }
      return false; // Still rate-limited
    }

    return true; // Token has remaining points
  }

  /**
   * Record usage of a token and update rate limit information.
   * @param token The token that was used
   * @param pointsUsed Number of GraphQL points consumed (default: 1)
   */
  recordUsage(token: string, pointsUsed = 1): void {
    const tokenEntry = this.pool.tokens.find((t) => t.token === token);
    if (!tokenEntry) {
      throw new Error(`Token not found in pool: ${token.slice(0, 10)}...`);
    }

    // Decrease remaining points
    tokenEntry.remainingPoints = Math.max(
      0,
      tokenEntry.remainingPoints - pointsUsed
    );
    tokenEntry.lastUsed = Date.now();
  }

  /**
   * Update rate limit information for a token from API response headers.
   * @param token The token to update
   * @param remaining Remaining GraphQL points
   * @param resetTime Unix timestamp (seconds) when rate limit resets
   */
  updateRateLimit(token: string, remaining: number, resetTime: number): void {
    const tokenEntry = this.pool.tokens.find((t) => t.token === token);
    if (!tokenEntry) {
      throw new Error(`Token not found in pool: ${token.slice(0, 10)}...`);
    }

    tokenEntry.remainingPoints = remaining;
    tokenEntry.resetTime = resetTime;
  }

  /**
   * Get the number of tokens in the pool.
   * @returns Number of tokens
   */
  getTokenCount(): number {
    return this.pool.tokens.length;
  }

  /**
   * Get the number of available (non-rate-limited) tokens.
   * @returns Number of available tokens
   */
  getAvailableTokenCount(): number {
    return this.pool.tokens.filter((t) => this.isTokenAvailable(t.token))
      .length;
  }
}
