/**
 * GraphQL Query Strings for GitHub API
 */

/**
 * GraphQL query to fetch user statistics for a specific time period.
 * Fetches commits, PRs, reviews, issues, followers, and repository stars.
 *
 * Variables:
 * - login: GitHub username
 * - from: Start date (ISO 8601 format)
 * - to: End date (ISO 8601 format)
 */
export const USER_STATS_QUERY = `
query UserStats($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    name
    createdAt
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
      totalCount
      nodes {
        stargazers {
          totalCount
        }
      }
    }
  }
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
`;

/**
 * GraphQL query to fetch the list of years a user has made contributions.
 * This is used to determine which years to fetch detailed stats for.
 *
 * Variables:
 * - login: GitHub username
 */
export const CONTRIBUTION_YEARS_QUERY = `
query ContributionYears($login: String!) {
  user(login: $login) {
    login
    createdAt
    contributionsCollection {
      contributionYears
    }
  }
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
`;
