# Implementation Plan.md

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Project Setup](#phase-0-project-setup)
3. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
4. [Phase 2: GitHub API Integration](#phase-2-github-api-integration)
5. [Phase 3: Ranking Engine](#phase-3-ranking-engine)
6. [Phase 4: Rendering System](#phase-4-rendering-system)
7. [Phase 5: Caching & Optimization](#phase-5-caching--optimization)
8. [Phase 6: Testing & Quality Assurance](#phase-6-testing--quality-assurance)
9. [Phase 7: Deployment & Launch](#phase-7-deployment--launch)
10. [Phase 8: Post-Launch Monitoring](#phase-8-post-launch-monitoring)
11. [Timeline & Milestones](#timeline--milestones)
12. [Risk Mitigation](#risk-mitigation)

---

## Overview

This implementation plan provides a step-by-step guide to building the GitHub Ranked plugin. The plan is divided into 8 phases, each building upon the previous phase. Each phase includes specific tasks, acceptance criteria, and dependencies.

**Total Estimated Timeline**: 6-8 weeks (assuming 1 developer, part-time)

**Prerequisites**:

- Node.js 24+ LTS installed (v24.13.0 recommended)
- GitHub account with API access
- Vercel account (free tier sufficient for MVP)
- Upstash account (free tier provides 10K commands/day)
- Basic understanding of TypeScript, React, and GraphQL

**Dependency Versions** (as of January 2025):
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.4 | React framework with App Router |
| react | 19.2.3 | UI library |
| typescript | 5.9.3 | Type safety |
| satori | 0.19.1 | SVG generation |
| zod | 4.3.6 | Runtime validation |
| @upstash/redis | 1.36.1 | Serverless caching |
| date-fns | 4.1.0 | Date manipulation |
| vitest | 4.0.18 | Unit testing |
| @vitest/coverage-v8 | 4.0.18 | Coverage reporting |
| playwright | 1.58.0 | E2E testing |
| @playwright/test | 1.58.0 | Playwright test runner |
| @types/node | 25.0.10 | Node.js type definitions |
| @types/react | 19.2.9 | React type definitions |
| eslint | 9.39.2 | Code linting |
| eslint-config-next | 16.1.4 | Next.js ESLint config |
| prettier | 3.8.1 | Code formatting |
| husky | 9.1.7 | Git hooks |
| lint-staged | 16.2.7 | Run linters on staged files |

---

## Phase 0: Project Setup

### 0.1 Initialize Project Repository

**Tasks**:

1. Create new Next.js project with TypeScript
2. Set up project structure
3. Configure package.json with dependencies
4. Set up Git repository
5. Create initial README.md

**Commands**:

```bash
# Create Next.js project with TypeScript, App Router, and Turbopack
npx create-next-app@16.1.4 github-ranked --typescript --app --turbopack --no-tailwind

cd github-ranked

# Install production dependencies
npm install satori@0.19.1 zod@4.3.6 @upstash/redis@1.36.1 date-fns@4.1.0

# Install development dependencies
npm install -D \
  @types/node@25.0.10 \
  @types/react@19.2.9 \
  vitest@4.0.18 \
  @vitest/coverage-v8@4.0.18 \
  playwright@1.58.0 \
  @playwright/test@1.58.0 \
  eslint@9.39.2 \
  eslint-config-next@16.1.4 \
  prettier@3.8.1 \
  husky@9.1.7 \
  lint-staged@16.2.7

# Install Playwright browsers
npx playwright install
```

**Project Structure**:

```
github-ranked/
├── api/
│   └── rank/
│       └── [username]/
│           └── route.ts
├── lib/
│   ├── github/
│   │   ├── aggregator.ts
│   │   ├── tokenPool.ts
│   │   └── types.ts
│   ├── ranking/
│   │   ├── engine.ts
│   │   ├── constants.ts
│   │   └── types.ts
│   ├── renderer/
│   │   ├── rankCard.tsx
│   │   ├── components/
│   │   │   ├── RankIcon.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── RadarChart.tsx
│   │   └── themes.ts
│   └── utils/
│       ├── validation.ts
│       ├── cache.ts
│       └── errors.ts
├── public/
│   └── icons/
│       ├── iron.svg
│       ├── bronze.svg
│       ├── silver.svg
│       ├── gold.svg
│       ├── platinum.svg
│       ├── emerald.svg
│       ├── diamond.svg
│       ├── master.svg
│       ├── grandmaster.svg
│       └── challenger.svg
├── docs/
│   ├── Architecture.md
│   ├── Implementation_Plan.md
│   ├── Product Description.md
│   ├── Quality Standards.md
│   └── TASKS.md
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local.example
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vercel.json
```

**Acceptance Criteria**:

- [ ] Project initializes without errors
- [ ] TypeScript compiles successfully
- [ ] All dependencies installed
- [ ] Git repository initialized
- [ ] Project structure matches specification

**Estimated Time**: 2 hours

---

## Phase 1: Core Infrastructure

### 1.1 Type Definitions

**File**: `/lib/github/types.ts`, `/lib/ranking/types.ts`

**Tasks**:

1. Define all TypeScript interfaces for data models
2. Create type guards for runtime validation
3. Export types for use across modules

**Key Types to Define**:

```typescript
// github/types.ts
export interface YearlyStats { ... }
export interface AggregatedStats { ... }
export interface GraphQLUserResponse { ... }

// ranking/types.ts
export type Tier = 'Iron' | 'Bronze' | ...;
export type Division = 'I' | 'II' | 'III' | 'IV';
export interface RankResult { ... }
```

**Acceptance Criteria**:

- [ ] All types defined as per Architecture.md
- [ ] Types compile without errors
- [ ] Type guards implemented for validation
- [ ] No `any` types used

**Estimated Time**: 3 hours

### 1.2 Validation Utilities

**File**: `/lib/utils/validation.ts`

**Tasks**:

1. Implement username validation (regex)
2. Implement query parameter validation
3. Create Zod schemas for runtime validation
4. Implement error formatting

**Functions to Implement**:

```typescript
export function validateUsername(username: string): boolean;
export function validateSeason(season: string): number | null;
export function validateTheme(theme: string): Theme;
export function validateToken(token: string): boolean;
```

**Acceptance Criteria**:

- [ ] Username validation matches GitHub rules
- [ ] All query parameters validated
- [ ] Zod schemas defined for all inputs
- [ ] Validation errors return proper HTTP status codes

**Estimated Time**: 2 hours

### 1.3 Error Handling System

**File**: `/lib/utils/errors.ts`

**Tasks**:

1. Define custom error classes
2. Implement error response formatter
3. Create error logging utility
4. Map errors to HTTP status codes

**Error Classes**:

```typescript
export class ValidationError extends Error { ... }
export class UserNotFoundError extends Error { ... }
export class RateLimitError extends Error { ... }
export class GitHubAPIError extends Error { ... }
```

**Acceptance Criteria**:

- [ ] All error types defined
- [ ] Error responses follow JSON format from Architecture.md
- [ ] Errors logged appropriately
- [ ] No stack traces exposed in production

**Estimated Time**: 2 hours

### 1.4 Constants Configuration

**File**: `/lib/ranking/constants.ts`

**Tasks**:

1. Define ranking constants (MEAN_LOG_SCORE, STD_DEV, etc.)
2. Define metric weights
3. Define rank thresholds (Elo ranges)
4. Define tier color schemes

**Acceptance Criteria**:

- [ ] All constants match Architecture.md specifications
- [ ] Constants are typed (no magic numbers)
- [ ] Constants are exported and testable

**Estimated Time**: 1 hour

**Phase 1 Total Estimated Time**: 8 hours

---

## Phase 2: GitHub API Integration

### 2.1 Token Pool Manager

**File**: `/lib/github/tokenPool.ts`

**Tasks**:

1. Implement token pool data structure
2. Implement round-robin token selection
3. Implement rate limit tracking
4. Implement token availability checking
5. Load tokens from environment variables

**Key Functions**:

```typescript
class TokenPoolManager {
  constructor();
  selectToken(): string;
  recordUsage(token: string, pointsUsed: number): void;
  isTokenAvailable(token: string): boolean;
  refreshPool(): void;
}
```

**Testing**:

- Test with multiple tokens
- Test token exhaustion scenario
- Test round-robin distribution

**Acceptance Criteria**:

- [ ] Token pool loads from environment variables
- [ ] Round-robin selection works correctly
- [ ] Rate limit tracking accurate
- [ ] Handles token exhaustion gracefully
- [ ] Unit tests pass (80%+ coverage)

**Estimated Time**: 4 hours

### 2.2 GraphQL Query Builder

**File**: `/lib/github/queries.ts`

**Tasks**:

1. Define GraphQL query strings
2. Create query builder functions
3. Implement variable injection
4. Handle query complexity

**Queries to Implement**:

```typescript
export const USER_STATS_QUERY = `...`;
export function buildUserStatsQuery(
  username: string,
  from: Date,
  to: Date
): { query: string; variables: object };
export const CONTRIBUTION_YEARS_QUERY = `...`;
```

**Acceptance Criteria**:

- [ ] All GraphQL queries match Architecture.md
- [ ] Queries compile without syntax errors
- [ ] Variables properly injected
- [ ] Query complexity within GitHub limits

**Estimated Time**: 2 hours

### 2.3 GraphQL Client

**File**: `/lib/github/client.ts`

**Tasks**:

1. Implement GraphQL request function
2. Implement retry logic with exponential backoff
3. Implement rate limit detection and handling
4. Implement error parsing and formatting
5. Handle network errors

**Key Functions**:

```typescript
export async function executeGraphQLQuery(
  query: string,
  variables: object,
  token: string
): Promise<GraphQLResponse>;

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo;
```

**Retry Logic**:

- Max 3 retries
- Exponential backoff: 1s, 2s, 4s
- Only retry on 403 (rate limit) or 5xx errors

**Acceptance Criteria**:

- [ ] GraphQL requests succeed
- [ ] Retry logic works correctly
- [ ] Rate limit detection accurate
- [ ] Error handling comprehensive
- [ ] Unit tests with mocked responses

**Estimated Time**: 4 hours

### 2.4 Data Aggregator

**File**: `/lib/github/aggregator.ts`

**Tasks**:

1. Implement contribution years fetching
2. Implement yearly stats fetching (parallel)
3. Implement all-time aggregation
4. Implement caching for historical years
5. Handle edge cases (no contributions, private repos, etc.)

**Key Functions**:

```typescript
export async function fetchContributionYears(
  username: string
): Promise<number[]>;
export async function fetchYearlyStats(
  username: string,
  year: number
): Promise<YearlyStats>;
export async function aggregateAllTimeStats(
  username: string,
  token?: string
): Promise<AggregatedStats>;
```

**Parallel Fetching**:

- Use `Promise.all()` for concurrent year requests
- Handle partial failures gracefully
- Aggregate results even if some years fail

**Acceptance Criteria**:

- [ ] Fetches all contribution years correctly
- [ ] Parallel fetching works (verify with timing)
- [ ] Aggregation sums correctly
- [ ] Handles edge cases (no data, errors)
- [ ] Integration tests with real GitHub API (rate-limited)

**Estimated Time**: 6 hours

**Phase 2 Total Estimated Time**: 16 hours

---

## Phase 3: Ranking Engine

### 3.1 Weighted Performance Index Calculator

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Implement WPI calculation function
2. Apply metric weights correctly
3. Cap stars at 500
4. Handle zero/negative values

**Function**:

```typescript
export function calculateWPI(stats: AggregatedStats): number {
  const wpi =
    stats.totalMergedPRs * 40 +
    stats.totalCodeReviews * 30 +
    stats.totalIssuesClosed * 20 +
    stats.totalCommits * 10 +
    Math.min(stats.totalStars, 500) * 5;
  return Math.max(wpi, 1); // Minimum 1 to avoid log(0)
}
```

**Testing**:

- Test with various stat combinations
- Test edge cases (all zeros, very large numbers)
- Verify weights are applied correctly

**Acceptance Criteria**:

- [ ] WPI calculation matches formula from Architecture.md
- [ ] Stars capped at 500
- [ ] Handles zero values correctly
- [ ] Unit tests with known inputs/outputs

**Estimated Time**: 2 hours

### 3.2 Z-Score Calculator

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Implement log-normal transformation
2. Calculate Z-score using constants
3. Handle edge cases (very small/large values)

**Function**:

```typescript
export function calculateZScore(wpi: number): number {
  const logScore = Math.log(wpi);
  const zScore = (logScore - MEAN_LOG_SCORE) / STD_DEV;
  return zScore;
}
```

**Testing**:

- Test with known WPI values
- Verify Z-score calculation matches expected values
- Test boundary conditions

**Acceptance Criteria**:

- [ ] Z-score calculation matches formula
- [ ] Log transformation correct
- [ ] Constants used correctly
- [ ] Unit tests pass

**Estimated Time**: 2 hours

### 3.3 Elo Calculator

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Implement Elo calculation from Z-score
2. Clamp Elo to valid range (0 to Infinity)
3. Round to nearest integer

**Function**:

```typescript
export function calculateElo(zScore: number): number {
  let elo = Math.round(BASE_ELO + zScore * ELO_PER_SIGMA);
  return Math.max(elo, 0); // Minimum 0
}
```

**Acceptance Criteria**:

- [ ] Elo calculation matches formula
- [ ] Clamping works correctly
- [ ] Rounding accurate
- [ ] Unit tests with known Z-scores

**Estimated Time**: 1 hour

### 3.4 Tier & Division Assignment

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Implement tier determination from Elo
2. Implement division calculation
3. Handle all tiers correctly

**Functions**:

```typescript
export function getTier(elo: number): Tier;
export function getDivision(elo: number, tier: Tier): Division;
```

**Division Logic**:

- Each tier has 4 divisions
- Division I is highest, Division IV is lowest
- Calculate based on position within tier range

**Acceptance Criteria**:

- [ ] All tiers assigned correctly
- [ ] Divisions calculated correctly
- [ ] Boundary conditions handled (exactly at threshold)
- [ ] Unit tests cover all tiers

**Estimated Time**: 3 hours

### 3.5 LP (League Points) Calculator

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Calculate LP within current division
2. Return value 0-99
3. Handle edge cases (exactly at division boundary)

**Function**:

```typescript
export function calculateLP(
  elo: number,
  tier: Tier,
  division: Division
): number {
  // Calculate division range
  // Calculate position within division
  // Return LP (0-99)
}
```

**Acceptance Criteria**:

- [ ] LP calculation correct
- [ ] Range 0-99 enforced
- [ ] Edge cases handled
- [ ] Unit tests pass

**Estimated Time**: 2 hours

### 3.6 Percentile Calculator

**File**: `/lib/ranking/engine.ts` (partial)

**Tasks**:

1. Calculate percentile from Z-score
2. Use standard normal distribution
3. Return as percentage

**Function**:

```typescript
export function calculatePercentile(zScore: number): number {
  // Use cumulative distribution function (CDF)
  // Convert to percentile (0-100)
}
```

**Acceptance Criteria**:

- [ ] Percentile calculation accurate
- [ ] Matches expected values for known Z-scores
- [ ] Unit tests pass

**Estimated Time**: 2 hours

### 3.7 Main Ranking Function

**File**: `/lib/ranking/engine.ts` (main export)

**Tasks**:

1. Orchestrate all ranking calculations
2. Return complete RankResult object
3. Handle errors gracefully

**Function**:

```typescript
export function calculateRank(stats: AggregatedStats): RankResult {
  const wpi = calculateWPI(stats);
  const zScore = calculateZScore(wpi);
  const elo = calculateElo(zScore);
  const tier = getTier(elo);
  const division = getDivision(elo, tier);
  const lp = calculateLP(elo, tier, division);
  const percentile = calculatePercentile(zScore);

  return {
    elo,
    tier,
    division,
    lp,
    wpi,
    zScore,
    percentile,
    stats,
  };
}
```

**Acceptance Criteria**:

- [ ] All calculations executed in correct order
- [ ] Complete RankResult returned
- [ ] Error handling implemented
- [ ] Integration tests with real data

**Estimated Time**: 2 hours

**Phase 3 Total Estimated Time**: 14 hours

---

## Phase 4: Rendering System

### 4.1 Tier Icon Assets

**Directory**: `/public/icons/`

**Tasks**:

1. Design or source SVG icons for each tier
2. Ensure consistent styling
3. Optimize file sizes
4. Test icon rendering

**Icons Needed**:

- iron.svg
- bronze.svg
- silver.svg
- gold.svg
- platinum.svg
- emerald.svg
- diamond.svg
- master.svg
- grandmaster.svg
- challenger.svg

**Design Requirements**:

- Match tier aesthetic from Architecture.md
- Scalable (SVG)
- Consistent size (recommended: 64x64px viewBox)
- Simple enough to render quickly

**Acceptance Criteria**:

- [ ] All 10 tier icons created
- [ ] Icons match design specifications
- [ ] Icons render correctly in browser
- [ ] File sizes < 5KB each

**Estimated Time**: 4 hours (or source from game-icons.net)

### 4.2 Rank Card Component

**File**: `/lib/renderer/rankCard.tsx`

**Tasks**:

1. Create main RankCard React component
2. Implement layout (400x120px)
3. Add tier-specific styling
4. Integrate all sub-components

**Component Structure**:

```tsx
export function RankCard({ rankResult, theme }: RankCardProps) {
  return (
    <div style={{ ...tierStyles[rankResult.tier] }}>
      <RankIcon tier={rankResult.tier} />
      <RankInfo>
        <TierName>
          {rankResult.tier} {rankResult.division}
        </TierName>
        <EloRating>{rankResult.elo} SR</EloRating>
        <LPProgress lp={rankResult.lp} />
      </RankInfo>
      <RadarChart metrics={rankResult.stats} />
    </div>
  );
}
```

**Acceptance Criteria**:

- [ ] Component renders correctly
- [ ] Layout matches specifications (400x120px)
- [ ] Tier styling applied correctly
- [ ] All sub-components integrated

**Estimated Time**: 3 hours

### 4.3 Rank Icon Component

**File**: `/lib/renderer/components/RankIcon.tsx`

**Tasks**:

1. Create RankIcon component
2. Load SVG icon based on tier
3. Apply tier-specific colors/filters
4. Handle icon loading errors

**Function**:

```tsx
export function RankIcon({ tier }: { tier: Tier }) {
  const iconPath = `/icons/${tier.toLowerCase()}.svg`;
  // Render icon with tier styling
}
```

**Acceptance Criteria**:

- [ ] Icons load correctly
- [ ] Tier styling applied
- [ ] Error handling for missing icons
- [ ] Icons scale properly

**Estimated Time**: 2 hours

### 4.4 Progress Bar Component

**File**: `/lib/renderer/components/ProgressBar.tsx`

**Tasks**:

1. Create progress bar component
2. Display LP progress (0-100)
3. Add visual styling (gradient, animation)
4. Show LP text ("45/100 LP")

**Component**:

```tsx
export function ProgressBar({ lp }: { lp: number }) {
  const percentage = lp;
  return (
    <div>
      <div style={{ width: `${percentage}%` }} />
      <span>{lp}/100 LP</span>
    </div>
  );
}
```

**Acceptance Criteria**:

- [ ] Progress bar displays correctly
- [ ] LP value accurate
- [ ] Visual styling matches design
- [ ] Responsive to LP changes

**Estimated Time**: 2 hours

### 4.5 Radar Chart Component

**File**: `/lib/renderer/components/RadarChart.tsx`

**Tasks**:

1. Create mini radar chart component
2. Display metric breakdown (PRs, Reviews, Issues, Commits)
3. Use SVG for rendering
4. Normalize values for display

**Component**:

```tsx
export function RadarChart({ metrics }: { metrics: AggregatedStats }) {
  // Render SVG radar chart
  // Show relative contribution of each metric
}
```

**Acceptance Criteria**:

- [ ] Radar chart renders correctly
- [ ] Metrics displayed accurately
- [ ] Visual design clear
- [ ] Fits within card layout

**Estimated Time**: 4 hours

### 4.6 Theme System

**File**: `/lib/renderer/themes.ts`

**Tasks**:

1. Define theme configurations
2. Implement theme switching
3. Apply theme to components

**Themes**:

- `default`: Full color, gaming aesthetic
- `dark`: Darker colors, high contrast
- `light`: Lighter colors, subtle styling

**Acceptance Criteria**:

- [ ] All themes defined
- [ ] Theme switching works
- [ ] Themes applied consistently
- [ ] Visual quality maintained

**Estimated Time**: 2 hours

### 4.7 Satori Integration

**File**: `/lib/renderer/render.ts`

**Tasks**:

1. Integrate Vercel Satori
2. Convert React component to SVG
3. Handle Satori-specific requirements
4. Optimize SVG output

**Function**:

```typescript
import satori from 'satori';
import { RankCard } from './rankCard';

export async function renderRankCard(rankResult: RankResult, theme: Theme): Promise<string> {
  const svg = await satori(
    <RankCard rankResult={rankResult} theme={theme} />,
    {
      width: 400,
      height: 120,
      fonts: [...], // Load fonts if needed
    }
  );
  return svg;
}
```

**Satori Requirements**:

- Must use supported CSS properties
- Fonts must be loaded explicitly
- Some React features not supported

**Acceptance Criteria**:

- [ ] SVG generation works
- [ ] Output matches design
- [ ] Performance acceptable (< 100ms)
- [ ] SVG valid and renderable

**Estimated Time**: 4 hours

**Phase 4 Total Estimated Time**: 21 hours

---

## Phase 5: Caching & Optimization

### 5.1 Cache Utilities

**File**: `/lib/utils/cache.ts`

**Tasks**:

1. Implement cache key generation
2. Implement cache get/set functions
3. Handle cache serialization
4. Implement TTL management

**Functions**:

```typescript
export function generateCacheKey(
  username: string,
  season?: number,
  theme?: string
): string;
export async function getCachedRank(key: string): Promise<RankResult | null>;
export async function setCachedRank(
  key: string,
  rank: RankResult,
  ttl: number
): Promise<void>;
```

**Cache Key Format**:

- `rank:{username}:{season}:{theme}`
- Example: `rank:octocat:2024:default`

**Acceptance Criteria**:

- [ ] Cache keys generated correctly
- [ ] Get/set operations work
- [ ] TTL enforced
- [ ] Serialization handles all data types

**Estimated Time**: 3 hours

### 5.2 Upstash Redis Integration

**File**: `/lib/utils/cache.ts` (extension)

**Tasks**:

1. Initialize Upstash Redis client (HTTP-based)
2. Implement Redis get/set operations
3. Handle Redis errors
4. Implement fallback if Redis unavailable

**Implementation**:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedRank(key: string): Promise<RankResult | null> {
  try {
    const cached = await redis.get<RankResult>(key);
    return cached;
  } catch (error) {
    // Log error, return null (cache miss)
    console.error('Redis cache error:', error);
    return null;
  }
}

export async function setCachedRank(
  key: string,
  rank: RankResult,
  ttl: number
): Promise<void> {
  try {
    await redis.set(key, rank, { ex: ttl });
  } catch (error) {
    console.error('Redis cache set error:', error);
  }
}
```

> **Note**: Upstash Redis uses HTTP-based access, which is ideal for serverless and edge environments as it doesn't require persistent connections.

**Acceptance Criteria**:

- [ ] Redis client initialized correctly
- [ ] Get/set operations work
- [ ] Error handling implemented
- [ ] Fallback works if Redis unavailable
- [ ] Works in Edge Runtime (HTTP-based access)

**Estimated Time**: 2 hours

### 5.3 Historical Year Caching

**File**: `/lib/github/aggregator.ts` (extension)

**Tasks**:

1. Implement cache check for historical years
2. Cache historical years with permanent TTL
3. Only fetch current year live
4. Invalidate current year cache appropriately

**Logic**:

```typescript
async function fetchYearlyStats(
  username: string,
  year: number
): Promise<YearlyStats> {
  const currentYear = new Date().getFullYear();

  if (year < currentYear) {
    // Check cache first (permanent cache)
    const cached = await getCachedYearStats(username, year);
    if (cached) return cached;
  }

  // Fetch from API
  const stats = await fetchFromGitHub(username, year);

  if (year < currentYear) {
    // Cache permanently
    await setCachedYearStats(username, year, stats, Infinity);
  } else {
    // Cache for 1 hour
    await setCachedYearStats(username, year, stats, 3600);
  }

  return stats;
}
```

**Acceptance Criteria**:

- [ ] Historical years cached permanently
- [ ] Current year cached with TTL
- [ ] Cache hits reduce API calls
- [ ] Cache invalidation works

**Estimated Time**: 3 hours

### 5.4 API Gateway Cache Integration

**File**: `/api/rank/[username]/route.ts` (extension)

**Tasks**:

1. Implement cache lookup at API gateway
2. Return cached SVG if available
3. Set cache after generation
4. Handle cache headers for CDN

**Implementation**:

```typescript
export async function GET(request: Request) {
  const { username, season, theme } = parseParams(request);
  const cacheKey = generateCacheKey(username, season, theme);

  // Check cache
  const cached = await getCachedRank(cacheKey);
  if (cached) {
    const svg = await renderRankCard(cached, theme);
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }

  // Cache miss - fetch and calculate
  const stats = await aggregateAllTimeStats(username);
  const rank = calculateRank(stats);
  await setCachedRank(cacheKey, rank, 86400);

  const svg = await renderRankCard(rank, theme);
  return new Response(svg, { headers: {...} });
}
```

**Acceptance Criteria**:

- [ ] Cache lookup works
- [ ] Cache hit returns immediately
- [ ] Cache set after generation
- [ ] Cache headers set correctly

**Estimated Time**: 2 hours

### 5.5 Performance Optimization

**Tasks**:

1. Optimize bundle size (tree-shaking)
2. Minimize API calls (parallel fetching)
3. Optimize SVG generation (Satori)
4. Add response compression (if needed)

**Optimizations**:

- Use dynamic imports for heavy modules
- Minimize dependencies
- Optimize Satori font loading
- Use Edge Runtime for faster cold starts

**Acceptance Criteria**:

- [ ] Bundle size < 500KB
- [ ] API calls minimized
- [ ] SVG generation < 100ms
- [ ] Cold start < 500ms

**Estimated Time**: 3 hours

**Phase 5 Total Estimated Time**: 13 hours

---

## Phase 6: Testing & Quality Assurance

### 6.1 Unit Tests - Ranking Engine

**File**: `/tests/unit/ranking/engine.test.ts`

**Tasks**:

1. Test WPI calculation with known inputs
2. Test Z-score calculation
3. Test Elo calculation
4. Test tier/division assignment
5. Test LP calculation

**Test Cases**:

- WPI with various stat combinations
- Z-score with known WPI values
- Elo mapping for all tiers
- Division boundaries
- LP edge cases

**Acceptance Criteria**:

- [ ] 80%+ code coverage
- [ ] All edge cases tested
- [ ] Tests pass consistently
- [ ] Test data matches expected outputs

**Estimated Time**: 4 hours

### 6.2 Unit Tests - GitHub Aggregator

**File**: `/tests/unit/github/aggregator.test.ts`

**Tasks**:

1. Mock GraphQL responses
2. Test aggregation logic
3. Test error handling
4. Test parallel fetching

**Test Cases**:

- Single year aggregation
- Multi-year aggregation
- Partial failures
- Empty data handling

**Acceptance Criteria**:

- [ ] Aggregation logic tested
- [ ] Error handling tested
- [ ] Mock responses realistic
- [ ] Tests pass

**Estimated Time**: 3 hours

### 6.3 Integration Tests

**File**: `/tests/integration/api.test.ts`

**Tasks**:

1. Test full API flow (end-to-end)
2. Test with real GitHub API (rate-limited)
3. Test caching behavior
4. Test error scenarios

**Test Cases**:

- Successful rank generation
- Cache hit scenario
- Cache miss scenario
- User not found
- Rate limit handling

**Acceptance Criteria**:

- [ ] Full flow works
- [ ] Caching works correctly
- [ ] Error handling works
- [ ] Tests use minimal API calls

**Estimated Time**: 4 hours

### 6.4 Visual Regression Tests

**Tasks**:

1. Generate rank cards for known users
2. Compare SVG output to expected
3. Test all tiers visually
4. Test all themes

**Tools**:

- Screenshot comparison
- SVG diff tool

**Acceptance Criteria**:

- [ ] All tiers render correctly
- [ ] All themes render correctly
- [ ] Visual quality maintained
- [ ] No regressions

**Estimated Time**: 3 hours

### 6.5 Load Testing

**Tasks**:

1. Test API under load
2. Measure response times
3. Test cache effectiveness
4. Test rate limit handling

**Tools**:

- k6, Artillery, or similar

**Scenarios**:

- 100 concurrent requests
- 1000 requests over 1 minute
- Cache hit vs miss performance

**Acceptance Criteria**:

- [ ] Response time < 2s (p95)
- [ ] Cache hit rate > 80%
- [ ] No errors under load
- [ ] Rate limits handled gracefully

**Estimated Time**: 3 hours

**Phase 6 Total Estimated Time**: 17 hours

---

## Phase 7: Deployment & Launch

### 7.1 Vercel Project Setup

**Tasks**:

1. Create Vercel project
2. Connect GitHub repository
3. Configure build settings
4. Set up environment variables

**Environment Variables**:

- `GITHUB_TOKEN_1` (required)
- `GITHUB_TOKEN_2` (optional)
- `UPSTASH_REDIS_REST_URL` (required)
- `UPSTASH_REDIS_REST_TOKEN` (required)

**Acceptance Criteria**:

- [ ] Project created on Vercel
- [ ] Repository connected
- [ ] Build succeeds
- [ ] Environment variables set

**Estimated Time**: 1 hour

### 7.2 Upstash Redis Setup

**Tasks**:

1. Add Upstash Redis via Vercel Marketplace (recommended) or create directly in Upstash
2. Get connection credentials (REST URL and Token)
3. Configure environment variables in Vercel project
4. Test connection from Edge Runtime

**Setup Options**:

- **Via Vercel Marketplace**: Navigate to your Vercel project → Storage → Add → Upstash Redis
- **Direct via Upstash**: Create account at upstash.com → Create Redis Database → Copy credentials

**Acceptance Criteria**:

- [ ] Upstash Redis database created
- [ ] Credentials configured in Vercel
- [ ] Connection test passes from serverless function
- [ ] Read/write operations work

**Estimated Time**: 1 hour

### 7.3 Deployment Configuration

**File**: `vercel.json`

**Tasks**:

1. Configure Edge Function runtime
2. Set up routing
3. Configure headers
4. Set up redirects (if needed)

**Configuration**:

```json
{
  "functions": {
    "api/rank/**": {
      "runtime": "@vercel/edge"
    }
  },
  "headers": [
    {
      "source": "/api/rank/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

**Acceptance Criteria**:

- [ ] Edge runtime configured
- [ ] Routing works correctly
- [ ] Headers set correctly
- [ ] Deployment succeeds

**Estimated Time**: 1 hour

### 7.4 Production Testing

**Tasks**:

1. Test API endpoint in production
2. Verify caching works
3. Test with various users
4. Monitor error rates
5. Check response times

**Test Users**:

- Popular users (high activity)
- New users (low activity)
- Users with no contributions
- Invalid usernames

**Acceptance Criteria**:

- [ ] API responds correctly
- [ ] Caching works
- [ ] All user types handled
- [ ] Error rates < 1%
- [ ] Response times acceptable

**Estimated Time**: 2 hours

### 7.5 Documentation

**Tasks**:

1. Create usage documentation
2. Create API documentation
3. Create deployment guide
4. Create troubleshooting guide

**Documentation Files**:

- `README.md` (usage)
- `docs/API.md` (API reference)
- `docs/DEPLOYMENT.md` (deployment guide)
- `docs/TROUBLESHOOTING.md` (common issues)

**Acceptance Criteria**:

- [ ] Usage examples provided
- [ ] API documented
- [ ] Deployment steps clear
- [ ] Troubleshooting guide complete

**Estimated Time**: 3 hours

### 7.6 Launch Preparation

**Tasks**:

1. Create example README badges
2. Prepare launch announcement
3. Set up monitoring/alerts
4. Prepare rollback plan

**Example Badge**:

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/username)
```

**Acceptance Criteria**:

- [ ] Example badges work
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Launch materials prepared

**Estimated Time**: 2 hours

**Phase 7 Total Estimated Time**: 10 hours

---

## Phase 8: Post-Launch Monitoring

### 8.1 Monitoring Setup

**Tasks**:

1. Set up error tracking (Sentry or similar)
2. Set up analytics (Vercel Analytics)
3. Set up uptime monitoring
4. Configure alerts

**Metrics to Monitor**:

- Request count
- Error rate
- Response time (p50, p95, p99)
- Cache hit rate
- Token pool utilization
- Rate limit events

**Acceptance Criteria**:

- [ ] Error tracking active
- [ ] Analytics configured
- [ ] Uptime monitoring active
- [ ] Alerts configured

**Estimated Time**: 2 hours

### 8.2 Performance Monitoring

**Tasks**:

1. Monitor response times
2. Monitor cache effectiveness
3. Monitor API usage
4. Identify bottlenecks

**Acceptance Criteria**:

- [ ] Performance metrics tracked
- [ ] Bottlenecks identified
- [ ] Optimization opportunities documented

**Estimated Time**: Ongoing

### 8.3 User Feedback Collection

**Tasks**:

1. Set up feedback mechanism
2. Monitor GitHub issues/discussions
3. Collect usage patterns
4. Identify feature requests

**Acceptance Criteria**:

- [ ] Feedback channel established
- [ ] Issues tracked
- [ ] Feature requests documented

**Estimated Time**: Ongoing

---

## Timeline & Milestones

### Week 1: Foundation

- **Days 1-2**: Phase 0 (Project Setup)
- **Days 3-4**: Phase 1 (Core Infrastructure)
- **Day 5**: Phase 2 start (GitHub API - Token Pool)

**Milestone 1**: Project structure complete, types defined, validation working

### Week 2: API Integration

- **Days 1-3**: Phase 2 (GitHub API Integration)
- **Days 4-5**: Phase 3 start (Ranking Engine - WPI, Z-Score)

**Milestone 2**: GitHub API integration complete, data fetching works

### Week 3: Ranking & Rendering

- **Days 1-2**: Phase 3 (Ranking Engine complete)
- **Days 3-5**: Phase 4 (Rendering System)

**Milestone 3**: Ranking calculations complete, SVG generation works

### Week 4: Optimization & Testing

- **Days 1-2**: Phase 5 (Caching & Optimization)
- **Days 3-5**: Phase 6 (Testing & QA)

**Milestone 4**: Caching implemented, tests passing

### Week 5: Deployment

- **Days 1-3**: Phase 7 (Deployment & Launch)
- **Days 4-5**: Phase 8 (Post-Launch Monitoring)

**Milestone 5**: Production deployment complete, monitoring active

### Week 6: Buffer & Polish

- Buffer time for unexpected issues
- Performance optimization
- Documentation polish
- Feature refinements

**Total Estimated Time**: 99 hours (6 weeks part-time)

---

## Risk Mitigation

### Risk 1: GitHub API Rate Limits

**Probability**: High  
**Impact**: High  
**Mitigation**:

- Implement token pool from start
- Aggressive caching strategy
- Monitor token usage
- Provide BYOT option

### Risk 2: Satori Compatibility Issues

**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:

- Test Satori early (Phase 4)
- Have fallback to static SVG generation
- Limit CSS features used
- Test on multiple platforms

### Risk 3: Performance Issues

**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:

- Optimize from start (not after)
- Use Edge Runtime
- Implement caching early
- Load test before launch

### Risk 4: Ranking Algorithm Accuracy

**Probability**: Low  
**Impact**: High  
**Mitigation**:

- Test with known users
- Validate against expected percentiles
- Allow algorithm tuning via constants
- Collect user feedback

### Risk 5: Upstash Redis Limitations

**Probability**: Low  
**Impact**: Medium  
**Mitigation**:

- Test Upstash Redis integration early
- Monitor free tier limits (10K commands/day on free plan)
- Implement cache size limits
- Consider upgrading to paid tier for production traffic

---

## Dependencies Between Phases

```
Phase 0 → Phase 1 (Project setup needed for infrastructure)
Phase 1 → Phase 2 (Types needed for API integration)
Phase 2 → Phase 3 (Data needed for ranking)
Phase 3 → Phase 4 (Rank results needed for rendering)
Phase 4 → Phase 5 (Rendering needed for caching)
Phase 5 → Phase 6 (Complete system needed for testing)
Phase 6 → Phase 7 (Tests passing needed for deployment)
Phase 7 → Phase 8 (Deployment needed for monitoring)
```

**Critical Path**: Phases 0-7 must be completed sequentially. Phase 8 can run in parallel with Phase 7.

---

## Success Criteria

### MVP (Minimum Viable Product)

- [ ] Rank badge generates for any GitHub user
- [ ] All 10 tiers supported (Iron → Challenger)
- [ ] Caching reduces API calls by 80%+
- [ ] Response time < 2 seconds (p95)
- [ ] Error rate < 1%
- [ ] Works in production on Vercel

### Full Product

- [ ] All features from Architecture.md implemented
- [ ] All tests passing (80%+ coverage)
- [ ] Documentation complete
- [ ] Monitoring active
- [ ] Performance optimized
- [ ] User feedback positive

---

## Conclusion

This implementation plan provides a detailed roadmap for building GitHub Ranked. Each phase builds upon the previous, with clear acceptance criteria and time estimates. The plan is designed to be flexible, allowing for adjustments based on actual progress and unforeseen challenges.

**Key Success Factors**:

1. Follow the plan sequentially (don't skip phases)
2. Test early and often
3. Optimize from the start (not after)
4. Monitor and iterate based on feedback
5. Maintain code quality throughout

By following this plan, the GitHub Ranked plugin can be built systematically, ensuring quality and maintainability while meeting all specified requirements.
