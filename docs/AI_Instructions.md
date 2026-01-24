# AI Instructions for GitHub Ranked Development

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Vision & Philosophy](#core-vision--philosophy)
3. [Technical Context](#technical-context)
4. [Architecture Summary](#architecture-summary)
5. [Key Algorithms](#key-algorithms)
6. [Coding Standards & Conventions](#coding-standards--conventions)
7. [File Structure Reference](#file-structure-reference)
8. [Implementation Priorities](#implementation-priorities)
9. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
10. [Testing Requirements](#testing-requirements)
11. [Behavioral Guidelines](#behavioral-guidelines)
12. [Quick Reference Tables](#quick-reference-tables)

---

## Project Overview

**GitHub Ranked** is a gamification plugin for GitHub profiles that transforms developer contribution statistics into competitive gaming-style ranks. The system analyzes a user's all-time GitHub activity and assigns them a "Dev-Elo" rating (0-3000+) with corresponding visual tiers (Iron → Challenger), similar to League of Legends and Valorant.

**What it does:**
- Fetches GitHub contribution data via GraphQL API
- Calculates a weighted "Dev-Elo" score using log-normal distribution
- Generates dynamic SVG rank badges using Vercel Satori
- Caches results for performance (24-hour TTL)
- Serves as an embeddable image for GitHub profile READMEs

**Target URL Format:**
```
https://github-ranked.vercel.app/api/rank/[username]
https://github-ranked.vercel.app/api/rank/[username]?season=2024&theme=dark
```

---

## Core Vision & Philosophy

### Design Principles

1. **Comparative Context Over Vanity Metrics**
   - The rank must communicate *relative standing* in the global developer community
   - A "Gold IV" developer instantly knows they're in the top 40%

2. **Interaction Over Isolation**
   - Reward collaboration (PRs, code reviews) over solo commits
   - A developer who only pushes to personal repos cannot reach Diamond+

3. **Prevent Gaming the System (Goodhart's Law)**
   - Commits are weighted lowest (10 points) to prevent "commit farming"
   - Code reviews (30 points) and merged PRs (40 points) are high-value signals

4. **Authentic Gaming Feel**
   - Use real percentile distributions from LoL/Valorant
   - Include LP (League Points), division progress, and tier aesthetics
   - The "flavor" is what makes it engaging, not just the numbers

### What Makes Someone "High Elo"
- **Challenger/GM**: Open source maintainers of major frameworks (React, Vue, Linux kernel)
- **Master/Diamond**: Senior engineers with consistent daily output + heavy collaboration
- **Emerald/Platinum**: Above-average developers with verified impactful work
- **Gold**: The median active developer (50th percentile target)
- **Silver/Bronze**: Casual contributors, students, learners
- **Iron**: Inactive accounts, "Hello World" repos

---

## Technical Context

### Technology Stack (Current Versions - January 2025)

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 24.13.0 LTS | Runtime environment |
| Next.js | 16.1.4 | React framework with App Router + Turbopack |
| React | 19.2.3 | UI library (for Satori components) |
| TypeScript | 5.9.3 | Type safety |
| Satori | 0.19.1 | HTML/CSS → SVG generation |
| @upstash/redis | 1.36.1 | Serverless Redis caching |
| Zod | 4.3.6 | Runtime validation |
| date-fns | 4.1.0 | Date manipulation |
| Vitest | 4.0.18 | Unit testing |
| Playwright | 1.58.0 | E2E testing |

### Important Notes
- **DO NOT USE `@vercel/kv`** - It was deprecated December 2024. Use `@upstash/redis` instead.
- **Vercel Edge Functions** are preferred over Node.js runtime for performance
- **GitHub GraphQL API** limits `contributionsCollection` to 1 year per request
- **Rate Limit**: 5,000 points/hour for authenticated requests

---

## Architecture Summary

The system follows a 4-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Profile README                     │
│                    ![](api/rank/username)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 1. API Gateway (Vercel Edge)                 │
│  • Route: /api/rank/[username]/route.ts                     │
│  • Validates input (Zod schema)                              │
│  • Checks cache (Upstash Redis)                              │
│  • Returns cached SVG or triggers fresh calculation          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            2. Data Aggregator (GitHub GraphQL)               │
│  • Fetches user's contributionYears list                     │
│  • Parallel fetches for each year                            │
│  • Aggregates: commits, PRs, reviews, issues, stars          │
│  • Handles rate limits with token pool                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               3. Ranking Engine (Dev-Elo)                    │
│  • Calculates weighted performance index                     │
│  • Applies log-normal transformation                         │
│  • Computes Z-score against global distribution              │
│  • Maps to Elo rating and Tier/Division                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             4. Renderer (Vercel Satori)                      │
│  • Converts React components to SVG                          │
│  • Applies tier-specific styling (gradients, icons)          │
│  • Generates 400x120px rank card                             │
│  • Returns image/svg+xml response                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Algorithms

### 1. Weighted Performance Index (WPI)

```typescript
const weights = {
  mergedPRs: 40,      // Highest value - peer acceptance
  codeReviews: 30,    // High value - seniority signal
  issuesClosed: 20,   // Medium value - problem-solving
  commits: 10,        // Low value - prevents farming
  stars: 5            // Capped at 500 to prevent viral distortion
};

const WPI = 
  (stats.mergedPRs * 40) +
  (stats.codeReviews * 30) +
  (stats.issuesClosed * 20) +
  (stats.commits * 10) +
  (Math.min(stats.stars, 500) * 5);
```

### 2. Log-Normal Z-Score Calculation

```typescript
// Global constants (derived from GitClear research)
const MEAN_LOG_SCORE = 6.5;  // Mean of log-transformed global activity
const STD_DEV = 1.5;         // Standard deviation

// Normalize using log (handles exponential distribution)
const logScore = Math.log(Math.max(WPI, 1));

// Calculate Z-score (standard deviations from mean)
const zScore = (logScore - MEAN_LOG_SCORE) / STD_DEV;
```

### 3. Elo Calculation

```typescript
// Base 1200 = median (Gold), each sigma = 400 Elo
let elo = Math.round(1200 + (zScore * 400));

// Clamp to valid range
elo = Math.max(0, elo);
// No upper clamp - Challenger can exceed 3000
```

### 4. Tier Mapping

```typescript
function getTier(elo: number): Tier {
  if (elo < 600) return 'Iron';
  if (elo < 900) return 'Bronze';
  if (elo < 1200) return 'Silver';
  if (elo < 1500) return 'Gold';
  if (elo < 1700) return 'Platinum';
  if (elo < 2000) return 'Emerald';
  if (elo < 2400) return 'Diamond';
  if (elo < 2600) return 'Master';
  if (elo < 3000) return 'Grandmaster';
  return 'Challenger';
}

function getDivision(elo: number, tier: Tier): Division {
  // Within each tier, divide into 4 divisions (IV, III, II, I)
  const tierRanges = {
    Iron: [0, 600],
    Bronze: [600, 900],
    // ... etc
  };
  const [min, max] = tierRanges[tier];
  const range = max - min;
  const position = elo - min;
  const divisionSize = range / 4;
  
  if (position < divisionSize) return 'IV';
  if (position < divisionSize * 2) return 'III';
  if (position < divisionSize * 3) return 'II';
  return 'I';
}
```

---

## Coding Standards & Conventions

### TypeScript
- **Strict mode enabled** (`strict: true` in tsconfig)
- **NO `any` types** - All types must be explicitly defined
- **Use Zod** for runtime validation at API boundaries
- **Prefer interfaces** over type aliases for object shapes

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `calculateRank()` |
| Classes | PascalCase | `TokenPoolManager` |
| Constants | UPPER_SNAKE_CASE | `MEAN_LOG_SCORE` |
| Files | kebab-case | `rank-card.tsx` |
| Interfaces | PascalCase | `RankResult` |

### File Organization
```
lib/
├── github/           # GitHub API integration
│   ├── aggregator.ts # Fetches and aggregates stats
│   ├── tokenPool.ts  # Manages API token rotation
│   └── types.ts      # GraphQL response types
├── ranking/          # Dev-Elo calculation
│   ├── engine.ts     # Core ranking algorithm
│   ├── constants.ts  # Weights, thresholds, tier data
│   └── types.ts      # Rank-related types
├── renderer/         # SVG generation
│   ├── rankCard.tsx  # Main card component
│   ├── components/   # Reusable components
│   └── themes.ts     # Tier-specific styling
└── utils/            # Shared utilities
    ├── validation.ts # Zod schemas
    ├── cache.ts      # Redis caching
    └── errors.ts     # Custom error classes
```

### Error Handling
```typescript
// Always use custom error classes
class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`User not found: ${username}`);
    this.name = 'UserNotFoundError';
  }
}

// Never swallow errors - always handle or rethrow
try {
  const stats = await fetchUserStats(username);
} catch (error) {
  if (error instanceof UserNotFoundError) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  logger.error('Unexpected error', { error, username });
  throw error; // Rethrow unknown errors
}
```

---

## File Structure Reference

```
github-ranked/
├── app/
│   └── api/
│       └── rank/
│           └── [username]/
│               └── route.ts      # Main API endpoint
├── lib/
│   ├── github/
│   │   ├── aggregator.ts         # GitHub data fetching
│   │   ├── tokenPool.ts          # Token management
│   │   ├── queries.ts            # GraphQL queries
│   │   └── types.ts              # GitHub types
│   ├── ranking/
│   │   ├── engine.ts             # Elo calculation
│   │   ├── constants.ts          # Tier thresholds, weights
│   │   └── types.ts              # Rank types
│   ├── renderer/
│   │   ├── rankCard.tsx          # Main SVG component
│   │   ├── components/
│   │   │   ├── TierIcon.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── RadarChart.tsx
│   │   └── themes.ts             # Color schemes
│   └── utils/
│       ├── validation.ts         # Zod schemas
│       ├── cache.ts              # Upstash Redis
│       └── errors.ts             # Error classes
├── public/
│   └── icons/                    # Tier SVG icons
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.local.example
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vercel.json
```

---

## Implementation Priorities

### Phase Order (DO NOT SKIP)
1. **Phase 0**: Project setup, dependencies, structure
2. **Phase 1**: TypeScript types and interfaces
3. **Phase 2**: GitHub GraphQL integration
4. **Phase 3**: Ranking engine (Dev-Elo algorithm)
5. **Phase 4**: SVG renderer (Satori)
6. **Phase 5**: Caching with Upstash Redis
7. **Phase 6**: Testing
8. **Phase 7**: Deployment to Vercel
9. **Phase 8**: Monitoring

### Critical Path Items
- [ ] Type definitions MUST be complete before implementation
- [ ] GitHub aggregator MUST handle multi-year fetching correctly
- [ ] Ranking engine MUST match documented percentile targets
- [ ] Cache MUST use 24-hour TTL by default
- [ ] All API responses MUST include proper cache headers

---

## Common Pitfalls to Avoid

### ❌ DON'T DO THIS

1. **Using @vercel/kv**
   ```typescript
   // ❌ WRONG - Deprecated
   import { kv } from '@vercel/kv';
   
   // ✅ CORRECT
   import { Redis } from '@upstash/redis';
   ```

2. **Linear scaling for contributions**
   ```typescript
   // ❌ WRONG - Treats 100 commits same as difference between 1000-1100
   const rank = commits / 5000;
   
   // ✅ CORRECT - Log-normal distribution
   const logScore = Math.log(Math.max(score, 1));
   const zScore = (logScore - MEAN) / STD_DEV;
   ```

3. **Fetching all years sequentially**
   ```typescript
   // ❌ WRONG - Slow
   for (const year of years) {
     await fetchYear(year);
   }
   
   // ✅ CORRECT - Parallel
   const results = await Promise.all(years.map(year => fetchYear(year)));
   ```

4. **Exposing tokens in responses**
   ```typescript
   // ❌ WRONG
   return { data, token: process.env.GITHUB_TOKEN };
   
   // ✅ CORRECT - Never expose tokens
   return { data };
   ```

5. **Using `any` types**
   ```typescript
   // ❌ WRONG
   function processData(data: any): any { ... }
   
   // ✅ CORRECT
   function processData(data: GitHubResponse): RankResult { ... }
   ```

6. **Hardcoding tier thresholds**
   ```typescript
   // ❌ WRONG - Magic numbers scattered in code
   if (elo > 2000) return 'Diamond';
   
   // ✅ CORRECT - Use constants
   import { TIER_THRESHOLDS } from './constants';
   const tier = Object.entries(TIER_THRESHOLDS)
     .find(([_, threshold]) => elo >= threshold)?.[0];
   ```

---

## Testing Requirements

### Coverage Targets
- **Unit Tests**: 80% minimum coverage
- **Ranking Engine**: 100% coverage (critical path)
- **Integration Tests**: All API endpoints covered

### Test Categories Required
1. **Happy Path**: Normal operation with valid inputs
2. **Edge Cases**: Zero contributions, max values, boundary conditions
3. **Error Cases**: Invalid usernames, API failures, rate limits
4. **Tier Boundaries**: Test exact Elo values at tier transitions

### Example Test Cases
```typescript
describe('calculateRank', () => {
  // Tier boundary tests
  it('should return Iron IV for elo 0', () => {...});
  it('should return Iron I for elo 599', () => {...});
  it('should return Bronze IV for elo 600', () => {...});
  
  // Percentile accuracy tests
  it('should place median developer at Gold IV (elo ~1200)', () => {...});
  it('should place top 2.5% at Diamond', () => {...});
  
  // Edge cases
  it('should handle zero contributions', () => {...});
  it('should cap star influence at 500', () => {...});
});
```

---

## Behavioral Guidelines

### Task Execution Workflow (CRITICAL)

**MANDATORY PROCESS - MUST FOLLOW FOR EVERY TASK:**

1. **Sequential Task Execution**
   - Tasks MUST be completed one at a time, in order
   - NEVER skip ahead to the next task until the current one is 100% complete
   - Only move forward when ALL acceptance criteria are met

2. **Acceptance Criteria Verification**
   - A task is NOT complete until every single acceptance criterion is checked off
   - Each checkbox in the acceptance criteria must be verified
   - No assumptions - if criteria says "test passes", you must actually run the test

3. **Testing Before Proceeding**
   - ALWAYS run tests before marking a task complete
   - Required tests for every task:
     - `npm run build` - Must pass without errors
     - `npm run lint` - Must pass without warnings
     - `npx tsc --noEmit` - TypeScript must compile cleanly
     - Any task-specific tests (unit tests, integration tests, etc.)
   - If ANY test fails, the task is NOT complete

4. **Immediate Task Completion Marking**
   - Mark tasks as complete in TASKS.md the SECOND all criteria are met
   - Update the checkbox items [x] and status to 🟢 Completed
   - Commit the updated TASKS.md immediately after completion

5. **Never Assume - Always Verify**
   - If uncertain about a package version, look it up on npm
   - If uncertain about a configuration, search online or check official docs
   - If uncertain about Node.js features, verify against Node.js 24.13.0 documentation
   - Use `npm info <package>` to verify package details
   - Use web search to verify current best practices

6. **Documentation of Completion**
   - Each completed task should have a git commit
   - Commit message should reference the task ID (e.g., "feat: implement P1-T2")
   - Include what was accomplished and what tests were run

### When Writing Code
1. **Always check the Architecture.md** before implementing a new module
2. **Follow the type definitions** in `lib/*/types.ts`
3. **Use Zod schemas** for all external data validation
4. **Add JSDoc comments** for all public functions
5. **Write tests** alongside implementation (TDD preferred)
6. **Run all tests before marking any task complete**

### When Making Decisions
1. **Performance vs Accuracy**: Prefer accuracy for ranking, performance for caching
2. **Simplicity vs Features**: Start simple, iterate based on feedback
3. **Gaming Feel**: Always ask "Would this feel authentic in LoL/Valorant?"

### When Uncertain
1. Check `GitHub Ranked.md` for the original vision
2. Check `Architecture.md` for technical decisions
3. Check `Quality Standards.md` for quality requirements
4. If still unclear, ask rather than assume

### Communication Style
- Be concise and specific
- Reference file paths when discussing code
- Use tier names (Gold, Diamond) not just Elo numbers
- Explain the "why" behind decisions

---

## Quick Reference Tables

### Tier Percentiles
| Tier | Percentile | Elo Range | Z-Score |
|------|------------|-----------|---------|
| Challenger | Top 0.02% | 3000+ | > +3.5 |
| Grandmaster | Top 0.1% | 2600-2999 | +3.1 to +3.5 |
| Master | Top 0.5% | 2400-2599 | +2.6 to +3.1 |
| Diamond | Top 2.5% | 2000-2399 | +1.96 to +2.6 |
| Emerald | Top 10% | 1700-1999 | +1.28 to +1.96 |
| Platinum | Top 20% | 1500-1699 | +0.84 to +1.28 |
| Gold | Top 40% | 1200-1499 | +0.25 to +0.84 |
| Silver | Top 60% | 900-1199 | -0.25 to +0.25 |
| Bronze | Top 80% | 600-899 | -0.84 to -0.25 |
| Iron | Bottom 20% | 0-599 | < -0.84 |

### Metric Weights
| Metric | Weight | Rationale |
|--------|--------|-----------|
| Merged PRs | 40 | Peer acceptance, collaboration |
| Code Reviews | 30 | Seniority signal |
| Issues Closed | 20 | Problem-solving |
| Commits | 10 | Lowest to prevent farming |
| Stars (capped 500) | 5 | Social proof |

### Tier Colors
| Tier | Primary Gradient | Accent |
|------|------------------|--------|
| Iron | #3a3a3a → #1a1a1a | #5c5c5c |
| Bronze | #8B4513 → #CD7F32 | #D4A574 |
| Silver | #C0C0C0 → #A8A8A8 | #E8E8E8 |
| Gold | #FFD700 → #FDB931 | #FFF4B8 |
| Platinum | #00CED1 → #20B2AA | #7FFFD4 |
| Emerald | #50C878 → #2E8B57 | #98FB98 |
| Diamond | #B9F2FF → #00D4FF | #E0FFFF |
| Master | #9932CC → #8B008B | #DA70D6 |
| Grandmaster | #DC143C → #8B0000 | #FF6B6B |
| Challenger | #FFD700 + rainbow | Animated glow |

### Cache TTL
| Data Type | TTL | Reason |
|-----------|-----|--------|
| User rank (current year) | 24 hours | Balance freshness vs rate limits |
| Historical years | 30 days | Data doesn't change |
| Not found users | 1 hour | Allow retry after username change |
| Error responses | 5 minutes | Allow quick retry |

---

## Documentation Cross-References

| Document | Purpose |
|----------|---------|
| [GitHub Ranked.md](GitHub%20Ranked.md) | Original vision, theory, psychology |
| [Architecture.md](Architecture.md) | Technical architecture, data flow |
| [Implementation_Plan.md](Implementation_Plan.md) | Step-by-step build guide |
| [TASKS.md](TASKS.md) | Granular task breakdown |
| [Quality Standards.md](Quality%20Standards.md) | Code quality, testing requirements |
| [API_Specification.md](API_Specification.md) | OpenAPI spec, endpoints |
| [GraphQL_Queries.md](GraphQL_Queries.md) | GitHub API queries |
| [Environment_Configuration.md](Environment_Configuration.md) | Environment variables |
| [Design_System.md](Design_System.md) | Visual specifications |
| [CI_CD_Pipeline.md](CI_CD_Pipeline.md) | Deployment automation |

---

*This document should be read by any AI assistant working on the GitHub Ranked project. Follow these guidelines to maintain consistency with the project vision and technical standards.*
