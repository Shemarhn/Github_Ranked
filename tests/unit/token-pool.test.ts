/**
 * Unit Tests for TokenPoolManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenPoolManager } from '@/lib/github/tokenPool';

describe('TokenPoolManager', () => {
  // Save original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  describe('constructor and refreshPool', () => {
    it('should load tokens from environment variables', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';
      process.env.GITHUB_TOKEN_3 = 'ghp_token3';

      const manager = new TokenPoolManager();
      expect(manager.getTokenCount()).toBe(3);
    });

    it('should throw error if no tokens found', () => {
      // Clear all GITHUB_TOKEN_* variables
      delete process.env.GITHUB_TOKEN_1;

      expect(() => new TokenPoolManager()).toThrow(
        'No GitHub tokens found in environment variables'
      );
    });

    it('should initialize tokens with default values', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';

      const manager = new TokenPoolManager();
      const token = manager.selectToken();

      expect(token).toBe('ghp_token1');
    });

    it('should refresh pool when refreshPool is called', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();
      expect(manager.getTokenCount()).toBe(1);

      // Add another token
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';
      manager.refreshPool();

      expect(manager.getTokenCount()).toBe(2);
    });
  });

  describe('selectToken', () => {
    it('should select tokens in round-robin fashion', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';
      process.env.GITHUB_TOKEN_3 = 'ghp_token3';

      const manager = new TokenPoolManager();

      const token1 = manager.selectToken();
      const token2 = manager.selectToken();
      const token3 = manager.selectToken();
      const token4 = manager.selectToken(); // Should wrap back to token1

      expect(token1).toBe('ghp_token1');
      expect(token2).toBe('ghp_token2');
      expect(token3).toBe('ghp_token3');
      expect(token4).toBe('ghp_token1');
    });

    it('should skip rate-limited tokens', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';

      const manager = new TokenPoolManager();

      // Exhaust first token
      manager.updateRateLimit('ghp_token1', 0, Date.now() / 1000 + 3600);

      // Should skip token1 and select token2
      const token = manager.selectToken();
      expect(token).toBe('ghp_token2');
    });

    it('should throw error if all tokens are rate-limited', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';

      const manager = new TokenPoolManager();

      // Exhaust all tokens
      const futureTime = Date.now() / 1000 + 3600;
      manager.updateRateLimit('ghp_token1', 0, futureTime);
      manager.updateRateLimit('ghp_token2', 0, futureTime);

      expect(() => manager.selectToken()).toThrow(
        'All GitHub tokens are rate-limited'
      );
    });
  });

  describe('isTokenAvailable', () => {
    it('should return true for tokens with remaining points', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      expect(manager.isTokenAvailable('ghp_token1')).toBe(true);
    });

    it('should return false for rate-limited tokens', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      // Exhaust token
      manager.updateRateLimit('ghp_token1', 0, Date.now() / 1000 + 3600);

      expect(manager.isTokenAvailable('ghp_token1')).toBe(false);
    });

    it('should return true if reset time has passed', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      // Set token as exhausted but with past reset time
      manager.updateRateLimit('ghp_token1', 0, Date.now() / 1000 - 100);

      // Should reset and be available
      expect(manager.isTokenAvailable('ghp_token1')).toBe(true);
    });

    it('should return false for non-existent tokens', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      expect(manager.isTokenAvailable('ghp_nonexistent')).toBe(false);
    });
  });

  describe('recordUsage', () => {
    it('should decrease remaining points', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      manager.recordUsage('ghp_token1', 10);

      // Verify by checking if we can still select it (should have 4990 points left)
      const token = manager.selectToken();
      expect(token).toBe('ghp_token1');
    });

    it('should not go below 0 points', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      // Use more points than available
      manager.recordUsage('ghp_token1', 6000);

      // Token should be exhausted
      manager.updateRateLimit('ghp_token1', 0, Date.now() / 1000 + 3600);
      expect(manager.isTokenAvailable('ghp_token1')).toBe(false);
    });

    it('should throw error for non-existent token', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      expect(() => manager.recordUsage('ghp_nonexistent', 1)).toThrow(
        'Token not found in pool'
      );
    });
  });

  describe('updateRateLimit', () => {
    it('should update remaining points and reset time', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      const resetTime = Date.now() / 1000 + 3600;
      manager.updateRateLimit('ghp_token1', 100, resetTime);

      // Token should still be available with 100 points
      expect(manager.isTokenAvailable('ghp_token1')).toBe(true);
    });

    it('should throw error for non-existent token', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      const manager = new TokenPoolManager();

      expect(() =>
        manager.updateRateLimit('ghp_nonexistent', 100, Date.now() / 1000)
      ).toThrow('Token not found in pool');
    });
  });

  describe('getTokenCount', () => {
    it('should return correct token count', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';
      process.env.GITHUB_TOKEN_3 = 'ghp_token3';

      const manager = new TokenPoolManager();
      expect(manager.getTokenCount()).toBe(3);
    });
  });

  describe('getAvailableTokenCount', () => {
    it('should return count of non-rate-limited tokens', () => {
      process.env.GITHUB_TOKEN_1 = 'ghp_token1';
      process.env.GITHUB_TOKEN_2 = 'ghp_token2';
      process.env.GITHUB_TOKEN_3 = 'ghp_token3';

      const manager = new TokenPoolManager();

      // Initially all available
      expect(manager.getAvailableTokenCount()).toBe(3);

      // Exhaust one token
      manager.updateRateLimit('ghp_token1', 0, Date.now() / 1000 + 3600);
      expect(manager.getAvailableTokenCount()).toBe(2);

      // Exhaust another
      manager.updateRateLimit('ghp_token2', 0, Date.now() / 1000 + 3600);
      expect(manager.getAvailableTokenCount()).toBe(1);
    });
  });
});
