/**
 * GitHub API Type Definitions
 * Types for GitHub GraphQL API responses and data structures
 */

// ============================================================================
// GraphQL Error Types
// ============================================================================

/**
 * GraphQL error object returned in API responses
 */
export interface GraphQLError {
  type?: string;
  message: string;
  path?: string[];
}

/**
 * Generic GraphQL response wrapper
 */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

// ============================================================================
// Contribution Types
// ============================================================================

/**
 * GitHub contributions collection for a specific date range
 */
export interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  restrictedContributionsCount: number;
  contributionYears?: number[];
}

/**
 * Statistics for a single year
 */
export interface YearlyStats {
  year: number;
  commits: number;
  prs: number;
  reviews: number;
  issues: number;
  privateContributions: number;
}

/**
 * Aggregated statistics across all years
 */
export interface AggregatedStats {
  totalCommits: number;
  totalMergedPRs: number;
  totalCodeReviews: number;
  totalIssuesClosed: number;
  totalStars: number;
  totalFollowers: number;
  firstContributionYear: number;
  lastContributionYear: number;
  yearsActive: number;
}

/**
 * Yearly stats with decay multiplier applied
 */
export interface DecayedYearlyStats extends YearlyStats {
  decayMultiplier: number;
}

/**
 * Extended aggregated stats with yearly breakdown for dashboard display
 * Includes both raw and decay-adjusted yearly statistics
 */
export interface ExtendedAggregatedStats extends AggregatedStats {
  /** Raw yearly stats before decay */
  yearlyBreakdown: YearlyStats[];
  /** Decay-adjusted yearly stats */
  decayedYearlyBreakdown: DecayedYearlyStats[];
}

// ============================================================================
// Repository Types
// ============================================================================

/**
 * Repository node in GraphQL response
 */
export interface RepositoryNode {
  name?: string;
  stargazerCount: number;
}

/**
 * Connection object for repositories
 */
export interface RepositoriesConnection {
  totalCount: number;
  nodes: RepositoryNode[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor: string;
  };
}

// ============================================================================
// User Types
// ============================================================================

/**
 * Followers connection object
 */
export interface FollowersConnection {
  totalCount: number;
}

/**
 * GitHub user object from GraphQL API
 */
export interface GitHubUser {
  login: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  contributionsCollection: ContributionsCollection;
  repositories: RepositoriesConnection;
  followers: FollowersConnection;
}

/**
 * Full user stats response from GraphQL
 */
export interface GraphQLUserResponse {
  user: GitHubUser | null;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

/**
 * Rate limit information from GitHub API headers
 */
export interface RateLimitInfo {
  limit: number;
  cost: number;
  remaining: number;
  resetAt: string;
}

// ============================================================================
// Type Guards
// ============================================================================

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Runtime type guard for `AggregatedStats`.
 */
export function isAggregatedStats(value: unknown): value is AggregatedStats {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isFiniteNumber(record.totalCommits) &&
    isFiniteNumber(record.totalMergedPRs) &&
    isFiniteNumber(record.totalCodeReviews) &&
    isFiniteNumber(record.totalIssuesClosed) &&
    isFiniteNumber(record.totalStars) &&
    isFiniteNumber(record.totalFollowers) &&
    isFiniteNumber(record.firstContributionYear) &&
    isFiniteNumber(record.lastContributionYear) &&
    isFiniteNumber(record.yearsActive)
  );
}
