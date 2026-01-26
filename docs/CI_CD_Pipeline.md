# CI/CD Pipeline Specification

> **Last Updated**: January 2026  
> **Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Stages](#pipeline-stages)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Vercel Deployment](#vercel-deployment)
5. [Quality Gates](#quality-gates)
6. [Branch Strategy](#branch-strategy)
7. [Secrets Management](#secrets-management)
8. [Monitoring & Alerts](#monitoring--alerts)

---

## 1. Overview

### 1.1 Pipeline Goals

- **Automation**: Automate build, test, and deployment processes
- **Quality**: Enforce code quality through automated checks
- **Speed**: Fast feedback loops for developers
- **Safety**: Prevent broken code from reaching production

### 1.2 Pipeline Triggers

| Event             | Action                             |
| ----------------- | ---------------------------------- |
| Push to `main`    | Deploy to production               |
| Push to `develop` | Deploy to staging                  |
| Pull Request      | Run tests, deploy preview          |
| Manual            | Production rollback, manual deploy |

---

## 2. Pipeline Stages

### 2.1 Stage Overview

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Lint   │ →  │  Build  │ →  │  Test   │ →  │ Preview │ →  │ Deploy  │
│ & Type  │    │         │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
    2min           1min          3min          2min          1min
```

### 2.2 Stage Details

**Stage 1: Lint & Type Check**

- ESLint (code style)
- Prettier (formatting check)
- TypeScript (type checking)
- Duration: ~2 minutes

**Stage 2: Build**

- Next.js build
- Bundle analysis
- Duration: ~1 minute

**Stage 3: Test**

- Unit tests (Vitest)
- Integration tests
- Coverage report
- Duration: ~3 minutes

**Stage 4: Preview Deploy**

- Vercel preview deployment
- E2E smoke tests
- Duration: ~2 minutes

**Stage 5: Production Deploy**

- Vercel production deployment
- Health check
- Duration: ~1 minute

---

## 3. GitHub Actions Workflows

### 3.1 Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Run TypeScript check
        run: npm run type-check

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          GITHUB_TOKEN_1: ${{ secrets.GITHUB_TOKEN_TEST }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_TEST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TEST_TOKEN }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/
          retention-days: 1

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage
        env:
          GITHUB_TOKEN_1: ${{ secrets.GITHUB_TOKEN_TEST }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_TEST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TEST_TOKEN }}

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [build, test]
    if: github.event_name == 'pull_request'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build
          path: .next/

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          GITHUB_TOKEN_1: ${{ secrets.GITHUB_TOKEN_TEST }}
          UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_TEST_URL }}
          UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TEST_TOKEN }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 3.2 Dependency Update Workflow

```yaml
# .github/workflows/dependencies.yml
name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch:

jobs:
  update:
    name: Update Dependencies
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Update dependencies
        run: |
          npm update
          npm audit fix || true

      - name: Run tests
        run: |
          npm ci
          npm run test

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update dependencies'
          title: 'chore: Weekly dependency updates'
          body: |
            Automated dependency updates.

            Please review the changes and ensure tests pass.
          branch: deps/weekly-update
          delete-branch: true
```

### 3.3 Security Audit Workflow

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily
  workflow_dispatch:

jobs:
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 3.4 Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog
        id: changelog
        uses: orhun/git-cliff-action@v3
        with:
          config: cliff.toml
          args: --latest

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.content }}
          draft: false
          prerelease: ${{ contains(github.ref, 'beta') || contains(github.ref, 'alpha') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 4. Vercel Deployment

### 4.1 Vercel Configuration

```json
// vercel.json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "functions": {
    "api/rank/**": {
      "runtime": "edge",
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/rank/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=86400"
        }
      ]
    }
  ],
  "github": {
    "enabled": true,
    "silent": true
  }
}
```

### 4.2 Deployment Environments

| Environment | Branch      | URL                                | Auto Deploy |
| ----------- | ----------- | ---------------------------------- | ----------- |
| Production  | `main`      | `github-ranked.vercel.app`         | Yes         |
| Staging     | `develop`   | `github-ranked-staging.vercel.app` | Yes         |
| Preview     | PR branches | `github-ranked-*.vercel.app`       | Yes         |

### 4.3 Vercel Project Settings

**Build & Development Settings**:

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`
- Development Command: `npm run dev`

**Environment Variables** (per environment):

- `GITHUB_TOKEN_1` through `GITHUB_TOKEN_N`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `LOG_LEVEL`
- `CACHE_TTL`

---

## 5. Quality Gates

### 5.1 Required Checks for Merge

All PRs must pass these checks before merge:

| Check          | Requirement      | Blocking   |
| -------------- | ---------------- | ---------- |
| Lint           | No errors        | ✅ Yes     |
| Type Check     | No errors        | ✅ Yes     |
| Unit Tests     | All passing      | ✅ Yes     |
| Code Coverage  | ≥ 80%            | ✅ Yes     |
| Build          | Successful       | ✅ Yes     |
| Security Audit | No high/critical | ⚠️ Warning |
| E2E Tests      | All passing      | ✅ Yes     |
| PR Review      | 1 approval       | ✅ Yes     |

### 5.2 Branch Protection Rules

**For `main` branch**:

```yaml
protection:
  required_status_checks:
    strict: true
    contexts:
      - 'Lint & Type Check'
      - 'Build'
      - 'Test'
      - 'Vercel'
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  enforce_admins: false
  restrictions: null
```

**For `develop` branch**:

```yaml
protection:
  required_status_checks:
    strict: false
    contexts:
      - 'Lint & Type Check'
      - 'Test'
  required_pull_request_reviews:
    required_approving_review_count: 1
  enforce_admins: false
```

### 5.3 Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'lib/ranking/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
});
```

---

## 6. Branch Strategy

### 6.1 Git Flow (Simplified)

```
main ─────────●─────────●─────────●───────── (production)
              ↑         ↑         ↑
develop ──●───┼───●─────┼───●─────┼───●───── (staging)
          ↑   │   ↑     │   ↑     │
feature ──┼───┘   │     │   │     │
          │       │     │   │     │
feature ──────────┘     │   │     │
                        │   │     │
hotfix ─────────────────┘   │     │
                            │     │
feature ────────────────────┘     │
                                  │
feature ──────────────────────────┘
```

### 6.2 Branch Naming Convention

| Type          | Pattern                | Example                   |
| ------------- | ---------------------- | ------------------------- |
| Feature       | `feature/description`  | `feature/add-dark-theme`  |
| Bug Fix       | `fix/description`      | `fix/rate-limit-header`   |
| Hotfix        | `hotfix/description`   | `hotfix/token-exhaustion` |
| Documentation | `docs/description`     | `docs/update-readme`      |
| Refactor      | `refactor/description` | `refactor/ranking-engine` |
| Dependencies  | `deps/description`     | `deps/weekly-update`      |

### 6.3 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:

```
feat(ranking): add seasonal ranking support

Implemented seasonal rankings with year parameter support.
- Added ?season query parameter
- Updated cache keys to include season
- Added tests for seasonal calculations

Closes #123
```

---

## 7. Secrets Management

### 7.1 GitHub Secrets

Required secrets in GitHub repository:

| Secret               | Description             | Used In         |
| -------------------- | ----------------------- | --------------- |
| `GITHUB_TOKEN_TEST`  | GitHub PAT for CI tests | CI workflows    |
| `UPSTASH_TEST_URL`   | Test Redis URL          | CI workflows    |
| `UPSTASH_TEST_TOKEN` | Test Redis token        | CI workflows    |
| `CODECOV_TOKEN`      | Codecov upload token    | Coverage report |
| `SNYK_TOKEN`         | Snyk security scan      | Security audit  |

### 7.2 Vercel Secrets

Set via Vercel Dashboard or CLI:

```bash
# Production secrets
vercel secrets add github-token-1 "ghp_xxx" --env production
vercel secrets add github-token-2 "ghp_yyy" --env production
vercel secrets add upstash-redis-url "https://xxx.upstash.io" --env production
vercel secrets add upstash-redis-token "xxx" --env production

# Staging secrets
vercel secrets add github-token-1 "ghp_staging" --env preview
vercel secrets add upstash-redis-url "https://staging.upstash.io" --env preview
vercel secrets add upstash-redis-token "staging_token" --env preview
```

### 7.3 Local Development Secrets

Use `.env.local` (gitignored):

```bash
# Create from template
cp .env.local.example .env.local

# Edit with your values
nano .env.local
```

---

## 8. Monitoring & Alerts

### 8.1 Deployment Notifications

Configure in Vercel → Project → Settings → Integrations:

**Slack Integration**:

- Channel: `#github-ranked-deploys`
- Events: Deployment success, failure, canceled

**GitHub Deployment Status**:

- Automatic via Vercel GitHub integration

### 8.2 CI Failure Alerts

Configure in GitHub → Repository → Settings → Notifications:

**Email Notifications**:

- On: Failed workflow runs
- To: Team email list

**Slack Notifications** (via GitHub Slack App):

- Channel: `#github-ranked-ci`
- Events: Workflow failures

### 8.3 Health Monitoring

**Vercel Analytics**:

- Built-in performance monitoring
- Real User Monitoring (RUM)
- Web Vitals tracking

**Uptime Monitoring** (recommended: UptimeRobot or Better Uptime):

- Endpoint: `https://github-ranked.vercel.app/api/health`
- Check interval: 5 minutes
- Alert on: 2 consecutive failures

### 8.4 Error Tracking (Optional)

**Sentry Integration**:

```typescript
// lib/utils/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1,
});
```

---

## 9. Rollback Procedures

### 9.1 Automatic Rollback

Vercel supports instant rollback:

1. Go to Vercel Dashboard → Project → Deployments
2. Find last known good deployment
3. Click "..." → "Promote to Production"

### 9.2 Manual Rollback via CLI

```bash
# List recent deployments
vercel ls github-ranked --prod

# Rollback to specific deployment
vercel rollback [deployment-id]

# Or promote a specific deployment
vercel promote [deployment-id] --prod
```

### 9.3 Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard HEAD~1
git push --force-with-lease origin main
```

---

## 10. Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "prepare": "husky install"
  }
}
```

---

## 11. Pre-commit Hooks

Using Husky and lint-staged:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm run test
```

---

## Appendix: Quick Reference

### CI Commands

```bash
# Run locally before pushing
npm run lint && npm run type-check && npm run test

# Check coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Deployment Commands

```bash
# Deploy to preview (automatic on PR)
git push origin feature/my-feature

# Deploy to production
git checkout main
git merge develop
git push origin main

# Manual rollback
vercel rollback [deployment-id]
```

### Debug Commands

```bash
# Check Vercel deployment status
vercel ls --prod

# View deployment logs
vercel logs [deployment-url]

# Check environment variables
vercel env ls
```
