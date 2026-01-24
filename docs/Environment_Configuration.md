# Environment Configuration Guide

> **Last Updated**: January 2026  
> **Version**: 1.0.0

## Table of Contents
1. [Overview](#overview)
2. [Required Environment Variables](#required-environment-variables)
3. [Optional Environment Variables](#optional-environment-variables)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## 1. Overview

This document outlines all environment variables required to run GitHub Ranked in various environments (development, staging, production).

### Configuration Files
- `.env.local` - Local development (gitignored)
- `.env.local.example` - Template for local development (committed)
- Vercel Environment Variables - Staging/Production (via Vercel Dashboard)

---

## 2. Required Environment Variables

These variables **must** be set for the application to function.

### 2.1 GitHub API Tokens

At least one GitHub Personal Access Token is required.

```bash
# Primary GitHub Token (Required)
GITHUB_TOKEN_1=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Additional tokens for token pool (Optional but recommended)
GITHUB_TOKEN_2=ghp_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
GITHUB_TOKEN_3=ghp_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
# Add more as needed: GITHUB_TOKEN_4, GITHUB_TOKEN_5, etc.
```

**Token Requirements**:
- **Type**: Classic PAT (`ghp_`) or Fine-grained PAT (`github_pat_`)
- **Required Scopes**:
  - `read:user` - Read user profile information
  - `public_repo` - Access public repository information (for stars count)
- **Optional Scopes**:
  - `repo` - Include private repository contributions (if supported)

**Creating a GitHub Token**:
1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token (classic)"
3. Select scopes: `read:user`, `public_repo`
4. Set expiration (recommend: 90 days, with rotation reminder)
5. Copy token immediately (won't be shown again)

### 2.2 Upstash Redis Configuration

Upstash Redis is used for caching rank results.

```bash
# Upstash Redis REST URL
UPSTASH_REDIS_REST_URL=https://xxxxxx.upstash.io

# Upstash Redis REST Token
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ==
```

**Setting Up Upstash Redis**:
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Select region closest to your Vercel deployment
4. Copy the REST URL and REST Token from the "REST API" section

**Why Upstash?**:
- HTTP-based access (no connection pooling issues)
- Optimized for serverless/edge environments
- Free tier: 10,000 commands/day
- Automatic scaling

---

## 3. Optional Environment Variables

### 3.1 Application Configuration

```bash
# Cache TTL in seconds (default: 86400 = 24 hours)
CACHE_TTL=86400

# Historical cache TTL in seconds (default: 2592000 = 30 days)
CACHE_TTL_HISTORICAL=2592000

# Maximum number of tokens to use from pool (default: 10)
MAX_TOKENS=10

# Log level: debug, info, warn, error (default: info)
LOG_LEVEL=info

# Enable debug mode (default: false)
DEBUG=false
```

### 3.2 Rate Limiting Configuration

```bash
# Requests per IP per hour (default: 100)
RATE_LIMIT_IP=100

# Requests per username per hour (default: 10)
RATE_LIMIT_USERNAME=10

# Enable rate limiting (default: true)
RATE_LIMIT_ENABLED=true
```

### 3.3 Ranking Algorithm Constants

These should generally not be changed unless recalibrating the algorithm.

```bash
# Log-normal mean (derived from global GitHub data)
MEAN_LOG_SCORE=6.5

# Standard deviation (derived from global GitHub data)
STD_DEV=1.5

# Base Elo (median rank)
BASE_ELO=1200

# Elo points per standard deviation
ELO_PER_SIGMA=400

# Maximum stars to count (prevents viral repos from skewing)
MAX_STARS_CAP=500
```

### 3.4 Feature Flags

```bash
# Enable seasonal rankings (default: true)
FEATURE_SEASONS=true

# Enable JSON response format (default: true)
FEATURE_JSON_FORMAT=true

# Enable themes (default: true)
FEATURE_THEMES=true

# Enable force refresh parameter (default: true)
FEATURE_FORCE_REFRESH=true
```

### 3.5 Monitoring & Analytics

```bash
# Vercel Analytics (automatically set by Vercel)
VERCEL_ANALYTICS_ID=

# Custom error tracking (e.g., Sentry)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Enable detailed request logging (default: false in production)
ENABLE_REQUEST_LOGGING=false
```

---

## 4. Environment-Specific Configuration

### 4.1 Development Environment

Create `.env.local` file:

```bash
# ========================================
# GitHub Ranked - Development Environment
# ========================================

# GitHub API Token (use your personal token)
GITHUB_TOKEN_1=ghp_your_personal_token_here

# Upstash Redis (use dev/test database)
UPSTASH_REDIS_REST_URL=https://your-dev-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_dev_token_here

# Development settings
LOG_LEVEL=debug
DEBUG=true
CACHE_TTL=300  # 5 minutes for faster iteration

# Disable rate limiting in development
RATE_LIMIT_ENABLED=false
```

### 4.2 Staging Environment

Set in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Environment: Preview

GITHUB_TOKEN_1=ghp_staging_token_1
GITHUB_TOKEN_2=ghp_staging_token_2

UPSTASH_REDIS_REST_URL=https://staging-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=staging_token_here

LOG_LEVEL=info
CACHE_TTL=3600  # 1 hour for testing
RATE_LIMIT_ENABLED=true
```

### 4.3 Production Environment

Set in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Environment: Production

# Multiple tokens for high availability
GITHUB_TOKEN_1=ghp_production_token_1
GITHUB_TOKEN_2=ghp_production_token_2
GITHUB_TOKEN_3=ghp_production_token_3
GITHUB_TOKEN_4=ghp_production_token_4
GITHUB_TOKEN_5=ghp_production_token_5

# Production Upstash Redis
UPSTASH_REDIS_REST_URL=https://production-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=production_token_here

# Production settings
LOG_LEVEL=warn
DEBUG=false
CACHE_TTL=86400  # 24 hours
RATE_LIMIT_ENABLED=true
RATE_LIMIT_IP=100
RATE_LIMIT_USERNAME=10
```

---

## 5. Security Best Practices

### 5.1 Token Security

**DO**:
- ✅ Use environment variables for all secrets
- ✅ Rotate tokens every 90 days
- ✅ Use fine-grained PATs with minimal scopes
- ✅ Use different tokens per environment
- ✅ Monitor token usage in GitHub settings

**DON'T**:
- ❌ Commit tokens to version control
- ❌ Log tokens in application code
- ❌ Share tokens between environments
- ❌ Use tokens with excessive scopes
- ❌ Use personal tokens in production

### 5.2 Token Rotation Procedure

1. **Generate new token** in GitHub settings
2. **Add new token** to environment variables (as `GITHUB_TOKEN_N+1`)
3. **Verify** new token works in staging
4. **Remove old token** from environment variables
5. **Revoke old token** in GitHub settings
6. **Document** rotation date for next rotation

### 5.3 Environment Variable Storage

| Environment | Storage Method | Access |
|------------|----------------|--------|
| Development | `.env.local` (gitignored) | Local only |
| Staging | Vercel Environment Variables | Preview deployments |
| Production | Vercel Environment Variables (encrypted) | Production only |

### 5.4 Secrets in CI/CD

For GitHub Actions or other CI/CD:

```yaml
# .github/workflows/test.yml
env:
  GITHUB_TOKEN_1: ${{ secrets.GITHUB_TOKEN_TEST }}
  UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_TEST_URL }}
  UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TEST_TOKEN }}
```

---

## 6. Troubleshooting

### 6.1 Common Issues

**Issue: "GitHub API rate limit exceeded"**
```
Solution: Add more tokens to the token pool (GITHUB_TOKEN_2, GITHUB_TOKEN_3, etc.)
```

**Issue: "Upstash connection failed"**
```
Solution: 
1. Verify UPSTASH_REDIS_REST_URL is correct (should be https://)
2. Verify UPSTASH_REDIS_REST_TOKEN is correct
3. Check Upstash dashboard for database status
```

**Issue: "Invalid token format"**
```
Solution:
1. Ensure token starts with 'ghp_' (classic) or 'github_pat_' (fine-grained)
2. Verify token hasn't been revoked
3. Check token has required scopes
```

**Issue: "Environment variable not found"**
```
Solution:
1. For local: Check .env.local file exists and is properly formatted
2. For Vercel: Verify variable is set for correct environment (Preview vs Production)
3. Redeploy after changing environment variables
```

### 6.2 Debugging Configuration

Run this script to verify configuration:

```typescript
// scripts/check-config.ts
import { config } from 'dotenv';

config({ path: '.env.local' });

const required = [
  'GITHUB_TOKEN_1',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

const optional = [
  'GITHUB_TOKEN_2',
  'CACHE_TTL',
  'LOG_LEVEL',
  'RATE_LIMIT_ENABLED',
];

console.log('=== Required Variables ===');
for (const key of required) {
  const value = process.env[key];
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`${status} ${key}: ${display}`);
}

console.log('\n=== Optional Variables ===');
for (const key of optional) {
  const value = process.env[key];
  const status = value ? '✅' : '⚪';
  console.log(`${status} ${key}: ${value || 'using default'}`);
}
```

Run with:
```bash
npx ts-node scripts/check-config.ts
```

### 6.3 Vercel Environment Variable Validation

In `next.config.ts`, add startup validation:

```typescript
// next.config.ts
const requiredEnvVars = [
  'GITHUB_TOKEN_1',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const nextConfig = {
  // ... your config
};

export default nextConfig;
```

---

## 7. Quick Reference

### Environment Variable Template

Copy this to `.env.local.example`:

```bash
# ========================================
# GitHub Ranked - Environment Variables
# ========================================
# Copy this file to .env.local and fill in values

# === REQUIRED ===

# GitHub Personal Access Token(s)
# Create at: https://github.com/settings/tokens
# Scopes needed: read:user, public_repo
GITHUB_TOKEN_1=

# Additional tokens for token pool (recommended for production)
GITHUB_TOKEN_2=
GITHUB_TOKEN_3=

# Upstash Redis Configuration
# Create at: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# === OPTIONAL ===

# Cache Configuration
CACHE_TTL=86400
CACHE_TTL_HISTORICAL=2592000

# Logging
LOG_LEVEL=info
DEBUG=false

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_IP=100
RATE_LIMIT_USERNAME=10

# Algorithm Constants (don't change unless recalibrating)
MEAN_LOG_SCORE=6.5
STD_DEV=1.5
BASE_ELO=1200
ELO_PER_SIGMA=400
MAX_STARS_CAP=500

# Feature Flags
FEATURE_SEASONS=true
FEATURE_JSON_FORMAT=true
FEATURE_THEMES=true
FEATURE_FORCE_REFRESH=true
```

### Minimum Viable Configuration

Absolute minimum to get started:

```bash
GITHUB_TOKEN_1=ghp_your_token_here
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```
