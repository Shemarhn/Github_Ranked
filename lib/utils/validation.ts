/**
 * Validation Utilities
 * Runtime validation for usernames and query parameters
 */

import { z } from 'zod';

/**
 * Supported theme variants for rank cards.
 */
export type Theme = 'default' | 'dark' | 'light' | 'minimal';

/**
 * GitHub username validation regex.
 * Rules: 1-39 chars, alphanumeric or single hyphens, cannot start/end with hyphen.
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/**
 * GitHub Personal Access Token (PAT) format regex.
 * Supports classic (ghp_) and fine-grained (github_pat_) tokens.
 */
export const TOKEN_REGEX = /^(ghp|github_pat)_[A-Za-z0-9_]{10,}$/;

/**
 * Current year used for seasonal validation.
 */
export const CURRENT_YEAR = new Date().getUTCFullYear();

/**
 * Zod schema for season parameter.
 */
export const SEASON_SCHEMA = z.coerce
  .number()
  .int()
  .min(2010)
  .max(CURRENT_YEAR + 1);

/**
 * Zod schema for theme parameter.
 */
export const THEME_SCHEMA = z.enum(['default', 'dark', 'light', 'minimal']);

/**
 * Zod schema for GitHub token parameter.
 */
export const TOKEN_SCHEMA = z
  .string()
  .regex(TOKEN_REGEX, { message: 'Invalid GitHub token format' });

/**
 * Zod schema for force parameter.
 */
export const FORCE_SCHEMA = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

/**
 * Validate a GitHub username.
 */
export function validateUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

/**
 * Validate and normalize a season parameter.
 */
export function validateSeason(season: string): number | null {
  const parsed = SEASON_SCHEMA.safeParse(season);
  return parsed.success ? parsed.data : null;
}

/**
 * Validate and normalize a theme parameter.
 */
export function validateTheme(theme: string): Theme {
  const parsed = THEME_SCHEMA.safeParse(theme);
  return parsed.success ? parsed.data : 'default';
}

/**
 * Validate a GitHub token parameter.
 */
export function validateToken(token: string): boolean {
  return TOKEN_REGEX.test(token);
}
