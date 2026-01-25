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

/**
 * GraphQL request object structure.
 */
export interface GraphQLRequest {
	query: string;
	variables: Record<string, unknown>;
}

/**
 * Build a GraphQL request for fetching user statistics.
 *
 * @param username - GitHub username
 * @param from - Start date (Date object or ISO 8601 string)
 * @param to - End date (Date object or ISO 8601 string)
 * @returns GraphQL request object with query and variables
 */
export function buildUserStatsQuery(
	username: string,
	from: Date | string,
	to: Date | string
): GraphQLRequest {
	// Format dates to ISO 8601 format
	const fromDate = typeof from === 'string' ? from : from.toISOString();
	const toDate = typeof to === 'string' ? to : to.toISOString();

	return {
		query: USER_STATS_QUERY,
		variables: {
			login: username,
			from: fromDate,
			to: toDate,
		},
	};
}

/**
 * Build a GraphQL request for fetching contribution years.
 *
 * @param username - GitHub username
 * @returns GraphQL request object with query and variables
 */
export function buildContributionYearsQuery(username: string): GraphQLRequest {
	return {
		query: CONTRIBUTION_YEARS_QUERY,
		variables: {
			login: username,
		},
	};
}

/**
 * Get start and end dates for a specific year in UTC.
 *
 * @param year - The year (e.g., 2024)
 * @returns Object with from and to Date objects
 */
export function getYearDates(year: number): { from: Date; to: Date } {
	// Start: January 1st, 00:00:00 UTC
	const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));

	// End: December 31st, 23:59:59.999 UTC
	const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

	return { from, to };
}
