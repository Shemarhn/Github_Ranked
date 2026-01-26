# GitHub GraphQL Queries Reference

> **Last Updated**: January 2026  
> **Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Query: Contribution Years](#query-contribution-years)
4. [Query: Yearly Statistics](#query-yearly-statistics)
5. [Query: User Profile](#query-user-profile)
6. [Query: Repository Stars](#query-repository-stars)
7. [Combined Query: Full User Stats](#combined-query-full-user-stats)
8. [Rate Limit Considerations](#rate-limit-considerations)
9. [Error Handling](#error-handling)
10. [TypeScript Types](#typescript-types)

---

## 1. Overview

GitHub Ranked uses GitHub's GraphQL API v4 to fetch user contribution statistics. This document provides the exact queries, variables, and expected responses.

### API Endpoint

```
https://api.github.com/graphql
```

### Request Format

```http
POST /graphql HTTP/1.1
Host: api.github.com
Authorization: Bearer <GITHUB_TOKEN>
Content-Type: application/json

{
  "query": "...",
  "variables": { ... }
}
```

---

## 2. Authentication

All queries require authentication via a GitHub Personal Access Token (PAT).

### Required Headers

```typescript
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'User-Agent': 'GitHub-Ranked/1.0',
};
```

### Token Scopes Required

- `read:user` - Read user profile data
- `public_repo` - Access public repository information

---

## 3. Query: Contribution Years

Fetch the list of years a user has made contributions.

### Query

```graphql
query ContributionYears($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionYears
    }
  }
}
```

### Variables

```json
{
  "login": "octocat"
}
```

### Response

```json
{
  "data": {
    "user": {
      "contributionsCollection": {
        "contributionYears": [2024, 2023, 2022, 2021, 2020, 2019, 2018]
      }
    }
  }
}
```

### TypeScript Implementation

```typescript
const CONTRIBUTION_YEARS_QUERY = `
  query ContributionYears($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

async function fetchContributionYears(
  username: string,
  token: string
): Promise<number[]> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: CONTRIBUTION_YEARS_QUERY,
      variables: { login: username },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  if (!data.data.user) {
    throw new UserNotFoundError(username);
  }

  return data.data.user.contributionsCollection.contributionYears;
}
```

---

## 4. Query: Yearly Statistics

Fetch contribution statistics for a specific year.

### Query

```graphql
query YearlyStats($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
    }
  }
}
```

### Variables

```json
{
  "login": "octocat",
  "from": "2024-01-01T00:00:00Z",
  "to": "2024-12-31T23:59:59Z"
}
```

### Response

```json
{
  "data": {
    "user": {
      "contributionsCollection": {
        "totalCommitContributions": 450,
        "totalPullRequestContributions": 85,
        "totalPullRequestReviewContributions": 120,
        "totalIssueContributions": 35,
        "restrictedContributionsCount": 50
      }
    }
  }
}
```

### Notes

- `totalPullRequestContributions` includes PRs created, not necessarily merged
- `totalPullRequestReviewContributions` is code reviews submitted
- `restrictedContributionsCount` is private repo contributions (requires token)
- Date range must be within the same year (GitHub API limitation)

### TypeScript Implementation

```typescript
const YEARLY_STATS_QUERY = `
  query YearlyStats($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
      }
    }
  }
`;

interface YearlyStats {
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  privateCounts: number;
}

async function fetchYearlyStats(
  username: string,
  year: number,
  token: string
): Promise<YearlyStats> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: YEARLY_STATS_QUERY,
      variables: { login: username, from, to },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  const collection = data.data.user.contributionsCollection;

  return {
    commits: collection.totalCommitContributions,
    prs: collection.totalPullRequestContributions,
    reviews: collection.totalPullRequestReviewContributions,
    issues: collection.totalIssueContributions,
    privateCounts: collection.restrictedContributionsCount,
  };
}
```

---

## 5. Query: User Profile

Fetch user profile information including follower count.

### Query

```graphql
query UserProfile($login: String!) {
  user(login: $login) {
    login
    name
    avatarUrl
    followers {
      totalCount
    }
    following {
      totalCount
    }
    createdAt
    updatedAt
  }
}
```

### Response

```json
{
  "data": {
    "user": {
      "login": "octocat",
      "name": "The Octocat",
      "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
      "followers": {
        "totalCount": 8900
      },
      "following": {
        "totalCount": 9
      },
      "createdAt": "2011-01-25T18:44:36Z",
      "updatedAt": "2024-12-15T10:30:00Z"
    }
  }
}
```

---

## 6. Query: Repository Stars

Fetch total stars across user's owned repositories.

### Query

```graphql
query UserStars($login: String!, $first: Int!) {
  user(login: $login) {
    repositories(
      first: $first
      ownerAffiliations: OWNER
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        stargazerCount
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

### Variables

```json
{
  "login": "octocat",
  "first": 100
}
```

### Response

```json
{
  "data": {
    "user": {
      "repositories": {
        "totalCount": 8,
        "nodes": [
          { "name": "Hello-World", "stargazerCount": 2500 },
          { "name": "Spoon-Knife", "stargazerCount": 12000 },
          { "name": "git-consortium", "stargazerCount": 100 }
        ],
        "pageInfo": {
          "hasNextPage": false,
          "endCursor": "Y3Vyc29yOnYyOpK5MjAxOC0wMS0wMVQwMDowMDowMCswMDowMM4DfNqL"
        }
      }
    }
  }
}
```

### Pagination for Large Repo Counts

```typescript
async function fetchAllStars(username: string, token: string): Promise<number> {
  let totalStars = 0;
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query UserStars($login: String!, $first: Int!, $after: String) {
        user(login: $login) {
          repositories(
            first: $first
            after: $after
            ownerAffiliations: OWNER
            orderBy: { field: STARGAZERS, direction: DESC }
          ) {
            nodes {
              stargazerCount
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { login: username, first: 100, after: cursor },
      }),
    });

    const data = await response.json();
    const repos = data.data.user.repositories;

    totalStars += repos.nodes.reduce(
      (sum: number, repo: { stargazerCount: number }) =>
        sum + repo.stargazerCount,
      0
    );

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;
  }

  return totalStars;
}
```

---

## 7. Combined Query: Full User Stats

For efficiency, combine multiple queries into a single request.

### Query

```graphql
query FullUserStats($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    # Profile
    login
    name
    createdAt

    # Followers
    followers {
      totalCount
    }

    # Contributions for specified year
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      restrictedContributionsCount
      contributionYears
    }

    # Repository stars (top 100 repos by stars)
    repositories(
      first: 100
      ownerAffiliations: OWNER
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      totalCount
      nodes {
        stargazerCount
      }
    }
  }
}
```

### Variables

```json
{
  "login": "octocat",
  "from": "2024-01-01T00:00:00Z",
  "to": "2024-12-31T23:59:59Z"
}
```

### Response

```json
{
  "data": {
    "user": {
      "login": "octocat",
      "name": "The Octocat",
      "createdAt": "2011-01-25T18:44:36Z",
      "followers": {
        "totalCount": 8900
      },
      "contributionsCollection": {
        "totalCommitContributions": 450,
        "totalPullRequestContributions": 85,
        "totalPullRequestReviewContributions": 120,
        "totalIssueContributions": 35,
        "restrictedContributionsCount": 50,
        "contributionYears": [2024, 2023, 2022, 2021, 2020]
      },
      "repositories": {
        "totalCount": 8,
        "nodes": [
          { "stargazerCount": 12000 },
          { "stargazerCount": 2500 },
          { "stargazerCount": 100 }
        ]
      }
    }
  }
}
```

---

## 8. Rate Limit Considerations

### GraphQL Rate Limits

- **Primary Rate Limit**: 5,000 points per hour (authenticated)
- **Query Cost**: Varies by query complexity
- **Secondary Rate Limits**: Max 100 concurrent requests, 2,000 points/minute

### Checking Rate Limits

```graphql
query RateLimit {
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
```

### Response

```json
{
  "data": {
    "rateLimit": {
      "limit": 5000,
      "cost": 1,
      "remaining": 4999,
      "resetAt": "2024-12-15T13:00:00Z"
    }
  }
}
```

### Query Cost Calculation

- Base cost: 1 point per request
- Additional cost based on:
  - Number of nodes requested
  - Complexity of nested objects
  - Pagination depth

### Typical Query Costs

| Query                 | Estimated Cost   |
| --------------------- | ---------------- |
| Contribution Years    | 1 point          |
| Yearly Stats          | 1 point          |
| Full User Stats       | 2-3 points       |
| Stars with pagination | 1 point per page |

### Rate Limit Headers

```http
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4997
X-RateLimit-Reset: 1702648800
X-RateLimit-Used: 3
X-RateLimit-Resource: graphql
```

---

## 9. Error Handling

### Common Errors

**User Not Found**:

```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "type": "NOT_FOUND",
      "path": ["user"],
      "message": "Could not resolve to a User with the login of 'nonexistent'."
    }
  ]
}
```

**Rate Limit Exceeded**:

```json
{
  "errors": [
    {
      "type": "RATE_LIMITED",
      "message": "API rate limit exceeded for user ID xxxxx."
    }
  ]
}
```

**Authentication Error**:

```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/graphql"
}
```

### Error Handling Implementation

```typescript
interface GraphQLError {
  type?: string;
  message: string;
  path?: string[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

function handleGraphQLResponse<T>(response: GraphQLResponse<T>): T {
  if (response.errors && response.errors.length > 0) {
    const error = response.errors[0];

    switch (error.type) {
      case 'NOT_FOUND':
        throw new UserNotFoundError(error.message);
      case 'RATE_LIMITED':
        throw new RateLimitError(error.message);
      case 'FORBIDDEN':
        throw new AuthenticationError(error.message);
      default:
        throw new GitHubAPIError(error.message);
    }
  }

  if (!response.data) {
    throw new GitHubAPIError('No data returned from GitHub API');
  }

  return response.data;
}
```

---

## 10. TypeScript Types

### GraphQL Response Types

```typescript
// Contribution collection
interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  restrictedContributionsCount: number;
  contributionYears?: number[];
}

// Repository node
interface RepositoryNode {
  name?: string;
  stargazerCount: number;
}

// Repositories connection
interface RepositoriesConnection {
  totalCount: number;
  nodes: RepositoryNode[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string;
  };
}

// Followers connection
interface FollowersConnection {
  totalCount: number;
}

// User object
interface GitHubUser {
  login: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  contributionsCollection: ContributionsCollection;
  repositories: RepositoriesConnection;
  followers: FollowersConnection;
}

// Full response
interface FullUserStatsResponse {
  user: GitHubUser | null;
}

// Rate limit info
interface RateLimitInfo {
  limit: number;
  cost: number;
  remaining: number;
  resetAt: string;
}
```

### Aggregated Stats Type

```typescript
interface AggregatedStats {
  totalCommits: number;
  totalMergedPRs: number; // Using PRs as proxy for merged
  totalCodeReviews: number;
  totalIssuesClosed: number; // Using issues as proxy for closed
  totalStars: number;
  totalFollowers: number;
  firstContributionYear: number;
  lastContributionYear: number;
  yearsActive: number;
}

function aggregateStats(
  yearlyStats: YearlyStats[],
  totalStars: number,
  followers: number
): AggregatedStats {
  const totals = yearlyStats.reduce(
    (acc, year) => ({
      commits: acc.commits + year.commits,
      prs: acc.prs + year.prs,
      reviews: acc.reviews + year.reviews,
      issues: acc.issues + year.issues,
    }),
    { commits: 0, prs: 0, reviews: 0, issues: 0 }
  );

  const years = yearlyStats.map((y) => y.year).sort((a, b) => a - b);

  return {
    totalCommits: totals.commits,
    totalMergedPRs: totals.prs,
    totalCodeReviews: totals.reviews,
    totalIssuesClosed: totals.issues,
    totalStars: totalStars,
    totalFollowers: followers,
    firstContributionYear: years[0],
    lastContributionYear: years[years.length - 1],
    yearsActive: years.length,
  };
}
```

---

## 11. Complete Fetch Implementation

### Full Data Fetching Function

```typescript
interface FetchUserStatsResult {
  stats: AggregatedStats;
  raw: {
    yearlyStats: Map<number, YearlyStats>;
    totalStars: number;
    followers: number;
    contributionYears: number[];
  };
}

async function fetchUserStats(
  username: string,
  token: string,
  options?: {
    season?: number; // If provided, only fetch this year
  }
): Promise<FetchUserStatsResult> {
  // 1. Fetch contribution years
  const years = await fetchContributionYears(username, token);

  if (years.length === 0) {
    throw new Error('User has no contribution history');
  }

  // 2. Determine which years to fetch
  const yearsToFetch = options?.season
    ? [options.season].filter((y) => years.includes(y))
    : years;

  // 3. Fetch all years in parallel
  const yearlyStatsPromises = yearsToFetch.map((year) =>
    fetchYearlyStats(username, year, token).then((stats) => ({ year, stats }))
  );

  // 4. Fetch stars (can be done in parallel)
  const starsPromise = fetchAllStars(username, token);

  // 5. Fetch followers
  const followersPromise = fetchFollowers(username, token);

  // 6. Wait for all data
  const [yearlyResults, totalStars, followers] = await Promise.all([
    Promise.all(yearlyStatsPromises),
    starsPromise,
    followersPromise,
  ]);

  // 7. Build yearly stats map
  const yearlyStatsMap = new Map<number, YearlyStats>();
  yearlyResults.forEach(({ year, stats }) => {
    yearlyStatsMap.set(year, { year, ...stats });
  });

  // 8. Aggregate
  const aggregated = aggregateStats(
    Array.from(yearlyStatsMap.values()),
    totalStars,
    followers
  );

  return {
    stats: aggregated,
    raw: {
      yearlyStats: yearlyStatsMap,
      totalStars,
      followers,
      contributionYears: years,
    },
  };
}
```

---

## Appendix: Query Examples for Testing

### Test in GitHub GraphQL Explorer

Visit: https://docs.github.com/en/graphql/overview/explorer

**Test Query 1: Check if user exists**

```graphql
{
  user(login: "octocat") {
    login
    name
  }
}
```

**Test Query 2: Get contribution years**

```graphql
{
  user(login: "octocat") {
    contributionsCollection {
      contributionYears
    }
  }
}
```

**Test Query 3: Get 2024 stats**

```graphql
{
  user(login: "octocat") {
    contributionsCollection(
      from: "2024-01-01T00:00:00Z"
      to: "2024-12-31T23:59:59Z"
    ) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
    }
  }
}
```

**Test Query 4: Check rate limit**

```graphql
{
  rateLimit {
    limit
    remaining
    resetAt
  }
}
```
