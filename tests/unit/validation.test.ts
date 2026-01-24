import { describe, expect, it } from 'vitest';

import {
  CURRENT_YEAR,
  FORCE_SCHEMA,
  SEASON_SCHEMA,
  THEME_SCHEMA,
  TOKEN_REGEX,
  TOKEN_SCHEMA,
  USERNAME_REGEX,
  validateSeason,
  validateTheme,
  validateToken,
  validateUsername,
} from '../../lib/utils/validation';

describe('validation utilities', () => {
  it('validates GitHub usernames', () => {
    expect(validateUsername('octocat')).toBe(true);
    expect(validateUsername('octo-cat')).toBe(true);
    expect(validateUsername('-octocat')).toBe(false);
    expect(validateUsername('octocat-')).toBe(false);
    expect(validateUsername('octo_cat')).toBe(false);
    expect(USERNAME_REGEX.test('a'.repeat(39))).toBe(true);
    expect(USERNAME_REGEX.test('a'.repeat(40))).toBe(false);
  });

  it('validates seasons within allowed range', () => {
    expect(validateSeason(String(2010))).toBe(2010);
    expect(validateSeason(String(CURRENT_YEAR))).toBe(CURRENT_YEAR);
    expect(validateSeason(String(CURRENT_YEAR + 1))).toBe(CURRENT_YEAR + 1);
    expect(validateSeason('2009')).toBeNull();
  });

  it('validates themes and falls back to default', () => {
    expect(validateTheme('dark')).toBe('dark');
    expect(validateTheme('light')).toBe('light');
    expect(validateTheme('minimal')).toBe('minimal');
    expect(validateTheme('invalid-theme')).toBe('default');
    expect(THEME_SCHEMA.safeParse('default').success).toBe(true);
  });

  it('validates GitHub token format', () => {
    const classicToken = 'ghp_1234567890abcdef';
    const fineGrainedToken = 'github_pat_1234567890abcdef';

    expect(validateToken(classicToken)).toBe(true);
    expect(validateToken(fineGrainedToken)).toBe(true);
    expect(TOKEN_REGEX.test('invalid_token')).toBe(false);
    expect(TOKEN_SCHEMA.safeParse(classicToken).success).toBe(true);
  });

  it('parses force flag with schema', () => {
    expect(FORCE_SCHEMA.safeParse('true').success).toBe(true);
    expect(FORCE_SCHEMA.safeParse('false').success).toBe(true);
    expect(FORCE_SCHEMA.safeParse(true).success).toBe(true);
    expect(FORCE_SCHEMA.safeParse('not-boolean').success).toBe(false);
  });

  it('parses season schema with coercion', () => {
    expect(SEASON_SCHEMA.safeParse(String(CURRENT_YEAR)).success).toBe(true);
  });
});
