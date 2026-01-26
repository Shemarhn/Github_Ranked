# API Specification

> **Version**: 1.0.0  
> **Last Updated**: January 2026  
> **OpenAPI Version**: 3.1.0

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints](#endpoints)
6. [Data Models](#data-models)
7. [Error Responses](#error-responses)
8. [Examples](#examples)

---

## 1. Overview

The GitHub Ranked API provides a single primary endpoint for generating dynamic rank badges for GitHub users. The API is designed to be embedded in GitHub profile READMEs as image URLs.

### Key Characteristics

- **Protocol**: HTTPS only
- **Response Format**: SVG (success) or JSON (errors)
- **Authentication**: Optional (for private repository access)
- **Rate Limiting**: IP-based and username-based limits
- **Caching**: 24-hour TTL for rank results

---

## 2. Base URL

**Production**:

```
https://github-ranked.vercel.app/api
```

**Staging**:

```
https://github-ranked-staging.vercel.app/api
```

**Local Development**:

```
http://localhost:3000/api
```

---

## 3. Authentication

### Public Access (Default)

No authentication required for basic rank badge generation using public GitHub data.

### Authenticated Access (Optional)

To include private repository contributions, provide a GitHub Personal Access Token (PAT).

**Methods**:

1. **Query Parameter**: `?token=ghp_xxx` (not recommended for public profiles)
2. **Authorization Header**: `Authorization: Bearer ghp_xxx` (recommended for programmatic access)

**Required Token Scopes**:

- `read:user` - Read user profile data
- `repo` (optional) - Access private repository contributions

**Token Format Validation**:

- Classic PAT: Starts with `ghp_`
- Fine-grained PAT: Starts with `github_pat_`

---

## 4. Rate Limiting

### Limits

| Limit Type   | Threshold    | Window |
| ------------ | ------------ | ------ |
| Per IP       | 100 requests | 1 hour |
| Per Username | 10 requests  | 1 hour |
| Cache Hits   | Not counted  | -      |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706187600
```

### Rate Limit Exceeded Response

```json
{
  "error": "RateLimitExceeded",
  "code": 429,
  "message": "Rate limit exceeded. Please wait before making more requests.",
  "retryAfter": 3600,
  "requestId": "req_abc123"
}
```

---

## 5. Endpoints

### 5.1 Generate Rank Badge

Generate a dynamic SVG rank badge for a GitHub user.

**Endpoint**:

```
GET /rank/{username}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | GitHub username (1-39 characters, alphanumeric and hyphens) |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `season` | integer | No | Current year | Year for seasonal ranking (2010 - current year) |
| `theme` | string | No | `default` | Visual theme: `default`, `dark`, `light`, `minimal` |
| `token` | string | No | - | GitHub PAT for private repository access |
| `force` | boolean | No | `false` | Bypass cache and recalculate rank |
| `format` | string | No | `svg` | Response format: `svg` or `json` |

**Success Response (SVG)**:

```
HTTP/1.1 200 OK
Content-Type: image/svg+xml
Cache-Control: public, max-age=3600, s-maxage=86400
X-Cache: HIT

<svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
  <!-- Rank card SVG content -->
</svg>
```

**Success Response (JSON - when format=json)**:

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600, s-maxage=86400

{
  "username": "octocat",
  "rank": {
    "tier": "Diamond",
    "division": "II",
    "elo": 2340,
    "lp": 45,
    "percentile": 97.5
  },
  "stats": {
    "totalCommits": 5420,
    "totalMergedPRs": 890,
    "totalCodeReviews": 1250,
    "totalIssuesClosed": 340,
    "totalStars": 12500,
    "totalFollowers": 8900
  },
  "calculatedAt": "2026-01-24T12:00:00Z",
  "cacheExpires": "2026-01-25T12:00:00Z"
}
```

**Error Responses**: See [Error Responses](#error-responses) section.

---

### 5.2 Health Check

Check API health status.

**Endpoint**:

```
GET /health
```

**Response**:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-24T12:00:00Z",
  "services": {
    "github": "operational",
    "cache": "operational"
  }
}
```

---

### 5.3 Get User Statistics (Debug/Analytics)

Get raw statistics without badge generation (for debugging/analytics).

**Endpoint**:

```
GET /stats/{username}
```

**Response**:

```json
{
  "username": "octocat",
  "stats": {
    "totalCommits": 5420,
    "totalMergedPRs": 890,
    "totalCodeReviews": 1250,
    "totalIssuesClosed": 340,
    "totalStars": 12500,
    "totalFollowers": 8900,
    "firstContributionYear": 2012,
    "lastContributionYear": 2026
  },
  "yearlyBreakdown": [
    { "year": 2026, "commits": 450, "prs": 85, "reviews": 120, "issues": 35 },
    { "year": 2025, "commits": 680, "prs": 110, "reviews": 150, "issues": 45 }
  ],
  "fetchedAt": "2026-01-24T12:00:00Z"
}
```

---

## 6. Data Models

### 6.1 RankResult

```typescript
interface RankResult {
  tier: Tier;
  division: Division;
  elo: number; // 0 - 3500+
  lp: number; // 0 - 99
  percentile: number; // 0 - 100
  wpi: number; // Weighted Performance Index
  zScore: number; // Standard deviations from mean
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
```

### 6.2 AggregatedStats

```typescript
interface AggregatedStats {
  totalCommits: number;
  totalMergedPRs: number;
  totalCodeReviews: number;
  totalIssuesClosed: number;
  totalStars: number; // Sum of stars on owned repos
  totalFollowers: number;
  firstContributionYear: number;
  lastContributionYear: number;
}
```

### 6.3 YearlyStats

```typescript
interface YearlyStats {
  year: number;
  commits: number;
  mergedPRs: number;
  codeReviews: number;
  issuesClosed: number;
  stars: number;
  followers: number;
}
```

### 6.4 Tier Thresholds

| Tier        | Min Elo | Max Elo | Percentile |
| ----------- | ------- | ------- | ---------- |
| Iron        | 0       | 599     | Bottom 20% |
| Bronze      | 600     | 899     | Top 80%    |
| Silver      | 900     | 1199    | Top 60%    |
| Gold        | 1200    | 1499    | Top 40%    |
| Platinum    | 1500    | 1699    | Top 20%    |
| Emerald     | 1700    | 1999    | Top 10%    |
| Diamond     | 2000    | 2399    | Top 2.5%   |
| Master      | 2400    | 2599    | Top 0.5%   |
| Grandmaster | 2600    | 2999    | Top 0.1%   |
| Challenger  | 3000    | ∞       | Top 0.02%  |

---

## 7. Error Responses

### Error Format

All error responses follow this structure:

```typescript
interface ErrorResponse {
  error: string; // Error type (PascalCase)
  code: number; // HTTP status code
  message: string; // Human-readable message
  details?: object; // Additional error context (optional)
  requestId: string; // Unique request ID for debugging
}
```

### Error Catalog

| Error Type          | Code | Description                         | User Action                        |
| ------------------- | ---- | ----------------------------------- | ---------------------------------- |
| `ValidationError`   | 400  | Invalid request parameters          | Check parameter format             |
| `InvalidUsername`   | 400  | Username doesn't match GitHub rules | Check username spelling            |
| `InvalidSeason`     | 400  | Season year out of valid range      | Use year between 2010 and current  |
| `InvalidTheme`      | 400  | Theme not in allowed list           | Use: default, dark, light, minimal |
| `InvalidToken`      | 400  | Token format invalid                | Use valid GitHub PAT               |
| `UserNotFound`      | 404  | GitHub user doesn't exist           | Verify username exists on GitHub   |
| `RateLimitExceeded` | 429  | Too many requests                   | Wait and retry (see retryAfter)    |
| `GitHubRateLimited` | 503  | GitHub API rate limit hit           | Wait or provide your own token     |
| `TokensExhausted`   | 503  | All service tokens exhausted        | Try again later or use BYOT        |
| `GitHubAPIError`    | 502  | Error from GitHub API               | Retry or check GitHub status       |
| `InternalError`     | 500  | Unexpected server error             | Contact support with requestId     |

### Example Error Responses

**Invalid Username (400)**:

```json
{
  "error": "InvalidUsername",
  "code": 400,
  "message": "Username 'invalid@user' contains invalid characters. GitHub usernames can only contain alphanumeric characters and hyphens.",
  "details": {
    "username": "invalid@user",
    "pattern": "^[a-zA-Z0-9]([a-zA-Z0-9-]{0,38})?$"
  },
  "requestId": "req_abc123def456"
}
```

**User Not Found (404)**:

```json
{
  "error": "UserNotFound",
  "code": 404,
  "message": "GitHub user 'nonexistentuser12345' not found. Please check the username spelling.",
  "details": {
    "username": "nonexistentuser12345"
  },
  "requestId": "req_xyz789ghi012"
}
```

**Rate Limit Exceeded (429)**:

```json
{
  "error": "RateLimitExceeded",
  "code": 429,
  "message": "You have exceeded the rate limit. Please wait 45 minutes before making more requests.",
  "details": {
    "limit": 100,
    "remaining": 0,
    "resetAt": "2026-01-24T13:00:00Z"
  },
  "retryAfter": 2700,
  "requestId": "req_rate123limit456"
}
```

**GitHub Tokens Exhausted (503)**:

```json
{
  "error": "TokensExhausted",
  "code": 503,
  "message": "Service is temporarily unavailable due to high demand. Please try again in a few minutes or provide your own GitHub token.",
  "details": {
    "suggestion": "Use ?token=YOUR_GITHUB_PAT to bypass service token limits"
  },
  "retryAfter": 300,
  "requestId": "req_tokens123exhaust456"
}
```

---

## 8. Examples

### 8.1 Basic Badge (Markdown)

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/octocat)
```

### 8.2 Badge with Dark Theme

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/octocat?theme=dark)
```

### 8.3 Seasonal Badge (2025)

```markdown
![GitHub Rank 2025](https://github-ranked.vercel.app/api/rank/octocat?season=2025)
```

### 8.4 Badge with Personal Token (HTML - for private repos)

```html
<img
  src="https://github-ranked.vercel.app/api/rank/octocat?token=ghp_xxxxxxxxxxxx"
  alt="GitHub Rank"
/>
```

### 8.5 Force Refresh Badge

```markdown
![GitHub Rank](https://github-ranked.vercel.app/api/rank/octocat?force=true)
```

### 8.6 Get JSON Data (Programmatic)

```bash
curl -H "Accept: application/json" \
     "https://github-ranked.vercel.app/api/rank/octocat?format=json"
```

### 8.7 Using with Authorization Header

```bash
curl -H "Authorization: Bearer ghp_xxxxxxxxxxxx" \
     "https://github-ranked.vercel.app/api/rank/octocat"
```

---

## 9. OpenAPI Schema (YAML)

```yaml
openapi: 3.1.0
info:
  title: GitHub Ranked API
  version: 1.0.0
  description: Dynamic rank badge generation for GitHub profiles
  contact:
    name: GitHub Ranked Support
    url: https://github.com/github-ranked/issues
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://github-ranked.vercel.app/api
    description: Production
  - url: https://github-ranked-staging.vercel.app/api
    description: Staging
  - url: http://localhost:3000/api
    description: Local Development

paths:
  /rank/{username}:
    get:
      summary: Generate rank badge
      description: Generate a dynamic SVG rank badge for a GitHub user
      operationId: getRankBadge
      tags:
        - Rank
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
            pattern: '^[a-zA-Z0-9]([a-zA-Z0-9-]{0,38})?$'
            minLength: 1
            maxLength: 39
          description: GitHub username
        - name: season
          in: query
          required: false
          schema:
            type: integer
            minimum: 2010
          description: Year for seasonal ranking
        - name: theme
          in: query
          required: false
          schema:
            type: string
            enum: [default, dark, light, minimal]
            default: default
          description: Visual theme
        - name: token
          in: query
          required: false
          schema:
            type: string
          description: GitHub PAT for private repo access
        - name: force
          in: query
          required: false
          schema:
            type: boolean
            default: false
          description: Bypass cache
        - name: format
          in: query
          required: false
          schema:
            type: string
            enum: [svg, json]
            default: svg
          description: Response format
      responses:
        '200':
          description: Successful response
          content:
            image/svg+xml:
              schema:
                type: string
            application/json:
              schema:
                $ref: '#/components/schemas/RankResponse'
        '400':
          description: Invalid request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: Rate limit exceeded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '503':
          description: Service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /health:
    get:
      summary: Health check
      description: Check API health status
      operationId: getHealth
      tags:
        - System
      responses:
        '200':
          description: Healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

components:
  schemas:
    RankResponse:
      type: object
      properties:
        username:
          type: string
        rank:
          $ref: '#/components/schemas/RankResult'
        stats:
          $ref: '#/components/schemas/AggregatedStats'
        calculatedAt:
          type: string
          format: date-time
        cacheExpires:
          type: string
          format: date-time

    RankResult:
      type: object
      properties:
        tier:
          type: string
          enum:
            [
              Iron,
              Bronze,
              Silver,
              Gold,
              Platinum,
              Emerald,
              Diamond,
              Master,
              Grandmaster,
              Challenger,
            ]
        division:
          type: string
          enum: [I, II, III, IV]
        elo:
          type: integer
          minimum: 0
        lp:
          type: integer
          minimum: 0
          maximum: 99
        percentile:
          type: number
          minimum: 0
          maximum: 100

    AggregatedStats:
      type: object
      properties:
        totalCommits:
          type: integer
        totalMergedPRs:
          type: integer
        totalCodeReviews:
          type: integer
        totalIssuesClosed:
          type: integer
        totalStars:
          type: integer
        totalFollowers:
          type: integer
        firstContributionYear:
          type: integer
        lastContributionYear:
          type: integer

    HealthResponse:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        version:
          type: string
        timestamp:
          type: string
          format: date-time
        services:
          type: object
          additionalProperties:
            type: string

    ErrorResponse:
      type: object
      required:
        - error
        - code
        - message
        - requestId
      properties:
        error:
          type: string
        code:
          type: integer
        message:
          type: string
        details:
          type: object
        retryAfter:
          type: integer
        requestId:
          type: string

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: GitHub Personal Access Token

security:
  - {}
  - bearerAuth: []

tags:
  - name: Rank
    description: Rank badge generation
  - name: System
    description: System health and status
```

---

## 10. SDK Examples

### 10.1 JavaScript/TypeScript

```typescript
async function getGitHubRank(
  username: string,
  options?: {
    season?: number;
    theme?: 'default' | 'dark' | 'light' | 'minimal';
    token?: string;
  }
): Promise<RankResponse> {
  const params = new URLSearchParams();
  params.set('format', 'json');
  if (options?.season) params.set('season', options.season.toString());
  if (options?.theme) params.set('theme', options.theme);
  if (options?.token) params.set('token', options.token);

  const response = await fetch(
    `https://github-ranked.vercel.app/api/rank/${username}?${params}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.error}: ${error.message}`);
  }

  return response.json();
}

// Usage
const rank = await getGitHubRank('octocat', { theme: 'dark' });
console.log(`${rank.username} is ${rank.rank.tier} ${rank.rank.division}`);
```

### 10.2 Python

```python
import requests

def get_github_rank(username: str, season: int = None, theme: str = None, token: str = None):
    params = {'format': 'json'}
    if season:
        params['season'] = season
    if theme:
        params['theme'] = theme
    if token:
        params['token'] = token

    response = requests.get(
        f'https://github-ranked.vercel.app/api/rank/{username}',
        params=params
    )
    response.raise_for_status()
    return response.json()

# Usage
rank = get_github_rank('octocat', theme='dark')
print(f"{rank['username']} is {rank['rank']['tier']} {rank['rank']['division']}")
```

---

## Changelog

### v1.0.0 (January 2026)

- Initial API release
- Core rank badge generation
- Theme support (default, dark, light, minimal)
- Seasonal rankings
- JSON response format option
- Rate limiting
- Error catalog
