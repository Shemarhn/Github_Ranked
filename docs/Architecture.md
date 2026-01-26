# Architecture.md

> **Last Updated**: January 2026  
> **Version**: 2.0 (Updated for Next.js 16, Upstash Redis, Satori 0.18+)

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Data Flow](#data-flow)
4. [Component Specifications](#component-specifications)
5. [API Design](#api-design)
6. [Data Models](#data-models)
7. [Caching Strategy](#caching-strategy)
8. [Rate Limiting & Token Management](#rate-limiting--token-management)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Scalability Considerations](#scalability-considerations)
12. [Technology Stack](#technology-stack)

---

## 1. System Overview

### 1.1 Purpose

GitHub Ranked is a serverless dynamic image generation service that calculates developer skill ratings (Dev-Elo) based on GitHub contribution statistics and renders them as gaming-style rank badges (SVG images) for embedding in GitHub README files.

### 1.2 Core Principles

- **Stateless Design**: All functions are stateless serverless functions
- **Cache-First Strategy**: Aggressive caching to minimize API calls
- **Edge Computing**: Leverage Vercel Edge Functions for low latency
- **Rate Limit Resilience**: Multi-token pool with intelligent distribution
- **Scalability**: Horizontal scaling through serverless architecture

### 1.3 System Boundaries

- **Input**: HTTP GET requests with GitHub username and optional parameters
- **Output**: SVG image (rank badge) or JSON error response
- **External Dependencies**: GitHub GraphQL API v4, Vercel Platform, Upstash Redis

---

## 2. Architecture Layers

### 2.1 Layer 1: API Gateway (Edge Function)

**Location**: `/api/rank/[username].ts` (Vercel Edge Function)

**Responsibilities**:

- Request validation and parameter parsing
- Cache lookup (Vercel KV)
- Request routing to appropriate handlers
- Response formatting (SVG or JSON error)
- CORS headers management
- Rate limiting per IP/user

**Technology**: Vercel Edge Runtime (Web API standard)

**Key Functions**:

```typescript
// Pseudo-structure
export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  // 1. Parse query parameters
  // 2. Validate username
  // 3. Check cache
  // 4. If cache miss, call Aggregator
  // 5. Render SVG via Satori
  // 6. Set cache
  // 7. Return SVG with proper headers
}
```

### 2.2 Layer 2: Data Aggregator (Serverless Function)

**Location**: `/lib/github/aggregator.ts`

**Responsibilities**:

- GitHub GraphQL API communication
- Historical data fetching (multi-year iteration)
- Data normalization and aggregation
- Metric calculation (Weighted Performance Index)
- Error handling and retry logic
- Token pool management

**Technology**: Node.js (Vercel Serverless Function)

**Key Functions**:

- `fetchUserContributionYears(username: string): Promise<number[]>`
- `fetchYearlyStats(username: string, year: number): Promise<YearlyStats>`
- `aggregateAllTimeStats(username: string): Promise<AggregatedStats>`
- `selectTokenFromPool(): string`

### 2.3 Layer 3: Ranking Engine (Pure Logic)

**Location**: `/lib/ranking/engine.ts`

**Responsibilities**:

- Weighted Performance Index (WPI) calculation
- Log-normal transformation
- Z-score computation
- Elo rating calculation
- Tier assignment (Iron → Challenger)
- Division calculation (I, II, III, IV)
- LP (League Points) calculation within division

**Technology**: Pure TypeScript (no external dependencies)

**Key Functions**:

- `calculateWPI(stats: AggregatedStats): number`
- `calculateZScore(wpi: number): number`
- `calculateElo(zScore: number): number`
- `getTier(elo: number): Tier`
- `getDivision(elo: number, tier: Tier): Division`
- `calculateLP(elo: number, tier: Tier, division: Division): number`

**Constants**:

```typescript
const MEAN_LOG_SCORE = 6.5; // Derived from global data
const STD_DEV = 1.5; // Standard deviation
const BASE_ELO = 1200; // Median (Gold IV)
const ELO_PER_SIGMA = 400; // Elo points per standard deviation
```

### 2.4 Layer 4: Rendering Engine (Satori)

**Location**: `/lib/renderer/rankCard.tsx`

**Responsibilities**:

- React component definition for rank card
- SVG generation via Vercel Satori
- Visual styling (gradients, icons, animations)
- Responsive design (fixed dimensions: 400x120px)
- Progress bar rendering
- Mini radar chart generation

**Technology**: React + Vercel Satori

**Key Components**:

- `<RankCard />`: Main container component
- `<RankIcon />`: Tier-specific icon renderer
- `<ProgressBar />`: LP progress visualization
- `<RadarChart />`: Metric breakdown visualization

---

## 3. Data Flow

### 3.1 Request Flow (Cache Hit)

```
User Request → API Gateway → Cache Lookup (KV) → Cache Hit → Return SVG
```

### 3.2 Request Flow (Cache Miss)

```
User Request → API Gateway → Cache Lookup (KV) → Cache Miss
  ↓
API Gateway → Data Aggregator
  ↓
Data Aggregator → GitHub GraphQL API (parallel requests per year)
  ↓
Data Aggregator → Ranking Engine (WPI → Z-Score → Elo → Tier)
  ↓
API Gateway → Rendering Engine (Satori) → SVG Generation
  ↓
API Gateway → Cache Storage (KV, TTL: 24h)
  ↓
API Gateway → Return SVG to User
```

### 3.3 Error Flow

```
Error at any layer → Error Handler → Log Error → Return JSON Error Response
```

---

## 4. Component Specifications

### 4.1 API Gateway Component

**File**: `/api/rank/[username]/route.ts` (App Router) or `/api/rank.ts` (Pages Router)

**Input Parameters**:

- `username` (path parameter): GitHub username (required)
- `season` (query): Year for seasonal ranking (optional, default: current year)
- `theme` (query): Visual theme variant (optional, default: "default")
- `token` (query): User-provided GitHub PAT (optional, for private repos)
- `force` (query): Bypass cache (optional, default: false)

**Output**:

- Success: SVG image with `Content-Type: image/svg+xml`
- Error: JSON with `Content-Type: application/json`

**Response Headers**:

```
Content-Type: image/svg+xml
Cache-Control: public, max-age=3600, s-maxage=86400
Access-Control-Allow-Origin: *
```

**Error Codes**:

- `400`: Invalid username format
- `404`: User not found
- `429`: Rate limit exceeded
- `500`: Internal server error
- `503`: Service unavailable (all tokens exhausted)

### 4.2 Data Aggregator Component

**File**: `/lib/github/aggregator.ts`

**GraphQL Query Structure**:

```graphql
query UserStats($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
    }
    followers {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      nodes {
        stargazers {
          totalCount
        }
      }
    }
  }
}
```

**Data Fetching Strategy**:

1. **Initial Query**: Fetch `contributionYears` list
2. **Parallel Execution**: Fire one GraphQL request per year simultaneously
3. **Aggregation**: Sum all yearly stats into all-time totals
4. **Optimization**: Cache historical years (2018-2024) permanently, only fetch current year live

**Retry Logic**:

- Max 3 retries per request
- Exponential backoff: 1s, 2s, 4s
- Retry only on rate limit (403) or network errors (5xx)

### 4.3 Ranking Engine Component

**File**: `/lib/ranking/engine.ts`

**Metric Weights** (as specified in document):

```typescript
const METRIC_WEIGHTS = {
  mergedPRs: 40,
  codeReviews: 30,
  issuesClosed: 20,
  commits: 10,
  stars: 5, // Capped at 500 stars
};
```

**Rank Thresholds** (Elo ranges):

```typescript
const RANK_THRESHOLDS = {
  Iron: { min: 0, max: 599 },
  Bronze: { min: 600, max: 899 },
  Silver: { min: 900, max: 1199 },
  Gold: { min: 1200, max: 1499 },
  Platinum: { min: 1500, max: 1699 },
  Emerald: { min: 1700, max: 1999 },
  Diamond: { min: 2000, max: 2399 },
  Master: { min: 2400, max: 2599 },
  Grandmaster: { min: 2600, max: 2999 },
  Challenger: { min: 3000, max: Infinity },
};
```

**Division Calculation**:

- Each tier has 4 divisions (I, II, III, IV)
- Division I is highest, Division IV is lowest
- Division range = (tier.max - tier.min) / 4
- Example: Gold (1200-1499) → Gold I: 1450-1499, Gold II: 1400-1449, etc.

**LP Calculation**:

- LP = (userElo - divisionMinElo) within current division
- Range: 0-99 LP per division
- Display format: "Gold II - 45 LP"

### 4.4 Rendering Engine Component

**File**: `/lib/renderer/rankCard.tsx`

**Component Structure**:

```tsx
<RankCard>
  <RankIcon tier={tier} />
  <RankInfo>
    <TierName>
      {tier} {division}
    </TierName>
    <EloRating>{elo} SR</EloRating>
    <LPProgress>{lp}/100 LP</LPProgress>
  </RankInfo>
  <RadarChart metrics={metrics} />
</RankCard>
```

**Visual Specifications**:

- **Dimensions**: 400px width × 120px height
- **Background**: Tier-specific gradient
- **Typography**:
  - Tier name: Bold, 24px, tier color
  - Elo: Regular, 18px, white
  - LP: Regular, 14px, gray
- **Icons**: SVG icons for each tier (stored in `/public/icons/`)
- **Progress Bar**: Visual LP progress (0-100)

**Tier Color Schemes**:

```typescript
const TIER_COLORS = {
  Iron: ['#3a3a3a', '#1a1a1a'],
  Bronze: ['#cd7f32', '#8b4513'],
  Silver: ['#c0c0c0', '#808080'],
  Gold: ['#FFD700', '#FDB931'],
  Platinum: ['#00d4ff', '#0099cc'],
  Emerald: ['#50c878', '#228b22'],
  Diamond: ['#b9f2ff', '#00d4ff'],
  Master: ['#9b59b6', '#6a1b9a'],
  Grandmaster: ['#e74c3c', '#c0392b'],
  Challenger: ['#f39c12', '#e67e22'],
};
```

---

## 5. API Design

### 5.1 Public API Endpoints

#### GET `/api/rank/[username]`

Generate rank badge for a GitHub user.

**Query Parameters**:

- `season` (optional): Year for seasonal ranking (e.g., `2024`)
- `theme` (optional): Visual theme (`default`, `dark`, `light`)
- `token` (optional): GitHub PAT for private repo access
- `force` (optional): Bypass cache (`true`/`false`)

**Example Request**:

```
GET /api/rank/octocat?season=2024&theme=dark
```

**Example Response** (SVG):

```xml
<svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
  <!-- Rank card SVG content -->
</svg>
```

**Example Error Response** (JSON):

```json
{
  "error": "User not found",
  "code": 404,
  "message": "The GitHub user 'invaliduser' does not exist."
}
```

### 5.2 Internal API (for future features)

#### POST `/api/rank/batch`

Batch rank calculation for multiple users (for organization rankings).

#### GET `/api/rank/[username]/stats`

Return raw JSON statistics (for debugging/analytics).

---

## 6. Data Models

### 6.1 TypeScript Interfaces

```typescript
// Core data structures

interface YearlyStats {
  year: number;
  commits: number;
  mergedPRs: number;
  codeReviews: number;
  issuesClosed: number;
  stars: number;
  followers: number;
}

interface AggregatedStats {
  totalCommits: number;
  totalMergedPRs: number;
  totalCodeReviews: number;
  totalIssuesClosed: number;
  totalStars: number;
  totalFollowers: number;
  firstContributionYear: number;
  lastContributionYear: number;
}

interface RankResult {
  elo: number;
  tier: Tier;
  division: Division;
  lp: number;
  wpi: number;
  zScore: number;
  percentile: number;
  stats: AggregatedStats;
}

type Tier =
  | 'Iron'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Emerald'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster'
  | 'Challenger';

type Division = 'I' | 'II' | 'III' | 'IV';

interface CacheEntry {
  rankResult: RankResult;
  timestamp: number;
  ttl: number; // 24 hours in milliseconds
}
```

### 6.2 GraphQL Response Model

```typescript
interface GraphQLUserResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalIssueContributions: number;
      restrictedContributionsCount: number;
    };
    followers: {
      totalCount: number;
    };
    repositories: {
      nodes: Array<{
        stargazers: {
          totalCount: number;
        };
      }>;
    };
  };
}
```

---

## 7. Caching Strategy

### 7.1 Cache Layers

**Layer 1: Upstash Redis (Primary Cache)**

- **Key Format**: `rank:{username}:{season}:{theme}`
- **TTL**: 24 hours (86400 seconds)
- **Storage**: Serialized `CacheEntry` object
- **Invalidation**: Manual via `force=true` parameter or TTL expiration
- **Note**: HTTP-based access optimized for serverless/edge environments

**Layer 2: Vercel Edge Cache (CDN)**

- **Cache-Control Headers**: `public, max-age=3600, s-maxage=86400`
- **Purpose**: Reduce serverless function invocations
- **Invalidation**: Same as KV cache

**Layer 3: Historical Year Cache**

- **Key Format**: `stats:{username}:{year}`
- **TTL**: Permanent (until manual invalidation)
- **Rationale**: Historical data (2018-2024) never changes
- **Only Current Year**: Fetched live with 1-hour cache

### 7.2 Cache Invalidation Strategy

**Automatic**:

- TTL expiration (24 hours)
- Cache-Control header expiration (1 hour CDN, 24 hours origin)

**Manual**:

- `force=true` query parameter
- Admin API endpoint (future feature)

**Smart Invalidation**:

- If user's last contribution date is > 24 hours ago, extend cache TTL to 7 days
- If user is inactive (no contributions in 30 days), extend to 30 days

---

## 8. Rate Limiting & Token Management

### 8.1 GitHub API Rate Limits

**GraphQL API**:

- **Authenticated**: 5,000 points per hour
- **GitHub Enterprise Cloud**: 10,000 points per hour
- **Query Cost**: ~1-5 points per query (depends on complexity)
- **Estimated Capacity**: 1,000-5,000 users per hour per token

**Secondary Rate Limits**:

- No more than 100 concurrent requests
- No more than 2,000 points per minute

**Resource Limits** (as of September 2025):

- GitHub enforces resource limits on individual queries
- Queries requesting large numbers of objects or deeply nested relationships may return partial results
- Use reasonable `first` arguments (recommend: 100 or fewer for repository listings)

> **Note**: Resource limits are separate from rate limits. A query may succeed within rate limits but still hit resource limits if it's too complex.

**REST API** (if needed):

- **Authenticated**: 5,000 requests per hour
- **Unauthenticated**: 60 requests per hour

### 8.2 Token Pool Architecture

**Token Pool Manager** (`/lib/github/tokenPool.ts`):

```typescript
interface TokenPool {
  tokens: Array<{
    token: string;
    remainingPoints: number;
    resetTime: number;
    lastUsed: number;
  }>;
  currentIndex: number;
}

class TokenPoolManager {
  // Round-robin token selection
  selectToken(): string;

  // Track rate limit usage
  recordUsage(token: string, pointsUsed: number): void;

  // Check if token is available
  isTokenAvailable(token: string): boolean;

  // Refresh token pool from environment variables
  refreshPool(): void;
}
```

**Token Selection Strategy**:

1. Round-robin distribution
2. Skip tokens that are rate-limited
3. If all tokens exhausted, return 503 Service Unavailable

**Environment Variables**:

```
GITHUB_TOKEN_1=ghp_xxx
GITHUB_TOKEN_2=ghp_yyy
GITHUB_TOKEN_3=ghp_zzz
...
```

### 8.3 Rate Limit Handling

**Detection**:

- GraphQL returns `403` with `X-RateLimit-Remaining: 0`
- Parse `X-RateLimit-Reset` header for reset time

**Response**:

1. Switch to next available token
2. If no tokens available, return 503 with retry-after header
3. Log rate limit event for monitoring

**User-Provided Tokens**:

- If `token` query parameter provided, use that token exclusively
- Bypass token pool
- User responsible for rate limits

---

## 9. Security Architecture

### 9.1 Input Validation

**Username Validation**:

- Regex: `^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$`
- Max length: 39 characters
- Reject special characters except hyphens (not at start/end)

**Query Parameter Validation**:

- `season`: Integer between 2010 and current year + 1
- `theme`: Enum whitelist (`default`, `dark`, `light`)
- `force`: Boolean (`true`/`false`)
- `token`: GitHub PAT format validation (starts with `ghp_` or `github_pat_`)

### 9.2 Token Security

**User-Provided Tokens**:

- Never logged or stored
- Only used for the specific request
- Not cached or persisted

**Service Tokens**:

- Stored in environment variables (Vercel Secrets)
- Never exposed in client-side code
- Rotated regularly

### 9.3 Rate Limiting (User-Facing)

**Per-IP Rate Limiting**:

- Max 100 requests per IP per hour
- Implemented via Upstash Redis with IP-based keys
- Return 429 if exceeded

**Per-Username Rate Limiting**:

- Max 10 requests per username per hour (prevents abuse)
- Cache hit doesn't count toward limit

### 9.4 Error Handling

**Error Response Format**:

```json
{
  "error": "Error type",
  "code": 400,
  "message": "Human-readable message",
  "requestId": "uuid-for-logging"
}
```

**Never Expose**:

- Internal error details
- Stack traces (in production)
- Token information
- API keys

---

## 10. Deployment Architecture

### 10.1 Vercel Deployment

**Project Structure**:

```
/
├── api/
│   └── rank/
│       └── [username]/
│           └── route.ts (Edge Function)
├── lib/
│   ├── github/
│   │   ├── aggregator.ts
│   │   └── tokenPool.ts
│   ├── ranking/
│   │   └── engine.ts
│   └── renderer/
│       └── rankCard.tsx
├── public/
│   └── icons/ (tier icons)
├── vercel.json (configuration)
└── package.json
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "functions": {
    "api/rank/**": {
      "runtime": "edge"
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
  ]
}
```

### 10.2 Environment Variables

**Required**:

- `GITHUB_TOKEN_1` (and optionally `GITHUB_TOKEN_2`, etc.)
- `UPSTASH_REDIS_REST_URL` (Upstash Redis)
- `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis)

**Optional**:

- `LOG_LEVEL` (`debug`, `info`, `warn`, `error`)
- `CACHE_TTL` (default: 86400)
- `MAX_TOKENS` (default: 10)

### 10.3 Monitoring & Logging

**Logging**:

- Use Vercel's built-in logging
- Log all API requests (username, timestamp, cache hit/miss)
- Log errors with stack traces (development only)
- Log rate limit events

**Metrics to Track**:

- Request count per hour
- Cache hit rate
- Average response time
- Error rate by type
- Token pool utilization

**Alerts**:

- All tokens exhausted (503 rate)
- Error rate > 5%
- Response time > 2 seconds (p95)

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling

**Serverless Functions**:

- Automatically scale with Vercel
- No manual scaling required
- Cold start mitigation: Edge Functions (faster than Node.js)

**Cache Scaling**:

- Upstash Redis scales automatically with serverless architecture
- HTTP-based access eliminates connection pooling issues
- Global replication available for low-latency access

### 11.2 Performance Optimization

**Parallel Data Fetching**:

- Fetch all years simultaneously (not sequentially)
- Use `Promise.all()` for concurrent GraphQL requests

**Lazy Loading**:

- Only fetch data when cache miss
- Pre-render common users (optional, future feature)

**Edge Caching**:

- Leverage Vercel's global CDN
- Cache-Control headers for optimal distribution

### 11.3 Cost Optimization

**Cache Strategy**:

- Aggressive caching reduces API calls
- Historical year caching eliminates redundant fetches

**Token Pool Efficiency**:

- Round-robin prevents single token exhaustion
- Monitor token usage to optimize pool size

**Function Optimization**:

- Minimize bundle size (tree-shaking)
- Use Edge Runtime for faster cold starts

---

## 12. Technology Stack

### 12.1 Core Technologies

**Runtime**:

- Vercel Edge Runtime (Web API standard)
- Node.js 20+ LTS (for serverless functions if needed)

**Language**:

- TypeScript 5.3+

**Framework**:

- Next.js 16+ (App Router, Turbopack enabled by default)
- React 19+ (for Satori rendering)

### 12.2 Key Libraries

**SVG Generation**:

- `satori` v0.18+ (Vercel Satori) - HTML/CSS to SVG, supports `obj-fit` for images
- `react` - Component definition for Satori

**GitHub API**:

- Native `fetch` API (Edge Runtime compatible)
- No GraphQL client library needed (manual query construction)

**Caching**:

- `@upstash/redis` - Upstash Redis client (HTTP-based, serverless-optimized)

> **Note**: Vercel KV was deprecated in December 2024. New projects should use Upstash Redis directly via the Vercel Marketplace. This project uses the `@upstash/redis` package which provides a REST-based client optimized for serverless environments.

**Utilities**:

- `zod` - Runtime type validation
- `date-fns` - Date manipulation

### 12.3 Development Tools

**Build**:

- `esbuild` (via Vercel)
- `swc` (via Next.js)

**Testing**:

- `vitest` - Unit testing (native TypeScript/ESM support, faster than Jest)
- `playwright` - E2E and visual regression testing

**Linting**:

- `eslint`
- `prettier`

---

## 13. Future Architecture Considerations

### 13.1 Planned Features

**Account Linking**:

- Store linked accounts in `.github/ranked-config.json`
- Aggregate stats across multiple accounts
- New data model: `LinkedAccountStats`

**Seasonal Rankings**:

- Separate cache keys per season
- Historical season badges (trophies)

**Team/Organization Rankings**:

- Aggregate stats for GitHub organizations
- New endpoint: `/api/rank/org/[orgname]`

**Analytics Dashboard**:

- Track rank changes over time
- New data model: `RankHistory`

### 13.2 Potential Optimizations

**Pre-computation**:

- Background jobs to pre-calculate ranks for popular users
- Reduce cache misses for viral profiles

**GraphQL Query Optimization**:

- Batch multiple users in single query (if GitHub supports)
- Reduce query complexity where possible

**CDN Asset Optimization**:

- Pre-generate tier icons as static assets
- Reduce SVG generation time

---

## 14. Architecture Diagrams

### 14.1 System Architecture (High-Level)

```
┌─────────────┐
│   GitHub    │
│   Profile   │
│  (README)   │
└──────┬──────┘
       │ HTTP GET
       │ /api/rank/username
       ▼
┌─────────────────────────────────┐
│      Vercel Edge Function       │
│      (API Gateway)              │
│  - Request validation           │
│  - Cache lookup                 │
│  - Response formatting          │
└──────┬──────────────────────────┘
       │
       ├─── Cache Hit ───► Return SVG
       │
       └─── Cache Miss ──►
                          │
                          ▼
                   ┌──────────────┐
                   │   Data       │
                   │  Aggregator  │
                   │  (Serverless)│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   GitHub     │
                   │  GraphQL API │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Ranking    │
                   │    Engine    │
                   │  (Pure Logic)│
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Renderer   │
                   │   (Satori)   │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  Cache Store │
                   │(Upstash Redis)│
                   └──────────────┘
```

### 14.2 Data Flow Diagram

```
User Request
    │
    ├─► Parse Parameters
    │
    ├─► Validate Username
    │
    ├─► Check Cache (KV)
    │   │
    │   ├─► Hit: Return Cached SVG
    │   │
    │   └─► Miss: Continue
    │
    ├─► Fetch Contribution Years
    │
    ├─► Parallel Fetch (per year)
    │   ├─► Year 2024 (live)
    │   ├─► Year 2023 (cached)
    │   ├─► Year 2022 (cached)
    │   └─► ...
    │
    ├─► Aggregate Stats
    │
    ├─► Calculate WPI
    │
    ├─► Calculate Z-Score
    │
    ├─► Calculate Elo
    │
    ├─► Determine Tier & Division
    │
    ├─► Calculate LP
    │
    ├─► Render SVG (Satori)
    │
    ├─► Store in Cache (24h TTL)
    │
    └─► Return SVG
```

---

## 15. Conclusion

This architecture document provides a comprehensive technical specification for the GitHub Ranked system. The design prioritizes:

1. **Performance**: Edge functions, aggressive caching, parallel data fetching
2. **Scalability**: Serverless architecture, horizontal scaling
3. **Reliability**: Token pool management, error handling, retry logic
4. **Maintainability**: Clear separation of concerns, TypeScript types, modular design

The architecture is designed to handle the expected load while remaining cost-effective and easy to maintain. All components are stateless and can be independently scaled or replaced as needed.
