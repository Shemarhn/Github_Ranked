type Actor = { login: string; __typename?: string } | null;
type Repository = { isPrivate: boolean; owner: { login: string } };
type PullRequest = {
  id: string;
  merged: boolean;
  author: Actor;
  mergedBy: Actor;
  repository: Repository;
};
type Connection<T> = { nodes: T[]; pageInfo: { hasNextPage: boolean } };

export interface PublicContributions {
  commitContributionsByRepository: {
    repository: Repository;
    contributions: Connection<{ commitCount: number }>;
  }[];
  pullRequestContributions: Connection<{ pullRequest: PullRequest }>;
  pullRequestReviewContributions: Connection<{
    pullRequest: PullRequest;
    pullRequestReview: { state: string };
  }>;
  issueContributions: Connection<{
    issue: { id: string; closed: boolean; repository: Repository };
  }>;
}

/** First ten interactions per group count fully; subsequent ones taper sharply. */
export function groupedCredit(groups: string[]): number {
  const counts = new Map<string, number>();
  for (const group of groups)
    counts.set(group.toLowerCase(), (counts.get(group.toLowerCase()) ?? 0) + 1);
  return [...counts.values()].reduce(
    (sum, n) => sum + (n <= 10 ? n : 10 + Math.sqrt(n - 10)),
    0
  );
}

function commitCredit(collection: PublicContributions): number {
  const counts = new Map<string, number>();
  for (const node of collection.commitContributionsByRepository) {
    if (node.repository.isPrivate) continue;
    const owner = node.repository.owner.login.toLowerCase();
    counts.set(
      owner,
      (counts.get(owner) ?? 0) +
        node.contributions.nodes.reduce((sum, day) => sum + day.commitCount, 0)
    );
  }
  return [...counts.values()].reduce(
    (sum, n) => sum + (n <= 100 ? n : 100 + Math.sqrt(n - 100)),
    0
  );
}

/** Use the tighter owner/counterparty total so splitting repositories does not help. */
function interactionCredit(
  prs: PullRequest[],
  counterpart: (pr: PullRequest) => string
): number {
  return Math.min(
    groupedCredit(prs.map((pr) => pr.repository.owner.login)),
    groupedCredit(prs.map(counterpart))
  );
}

export function scorePublicContributions(
  collection: PublicContributions,
  username: string
) {
  const unique = <T>(items: T[], id: (item: T) => string): T[] => [
    ...new Map(items.map((item) => [id(item), item])).values(),
  ];
  const prs = unique(
    collection.pullRequestContributions.nodes
      .map((n) => n.pullRequest)
      .filter((pr) => !pr.repository.isPrivate && pr.merged),
    (pr) => pr.id
  );
  const reviews = unique(
    collection.pullRequestReviewContributions.nodes
      .filter(
        (n) =>
          n.pullRequestReview.state !== 'PENDING' &&
          n.pullRequestReview.state !== 'DISMISSED'
      )
      .map((n) => n.pullRequest)
      .filter(
        (pr) =>
          !pr.repository.isPrivate &&
          pr.author &&
          pr.author.__typename !== 'Bot' &&
          pr.author.login.toLowerCase() !== username.toLowerCase()
      ),
    (pr) => pr.id
  );
  const issues = unique(
    collection.issueContributions.nodes
      .map((n) => n.issue)
      .filter((issue) => !issue.repository.isPrivate && issue.closed),
    (issue) => issue.id
  );
  return {
    commits: commitCredit(collection),
    prs: interactionCredit(
      prs,
      (pr) => pr.mergedBy?.login ?? pr.repository.owner.login
    ),
    reviews: interactionCredit(reviews, (pr) => pr.author!.login),
    issues: groupedCredit(issues.map((issue) => issue.repository.owner.login)),
    // These are deliberately bounded observations, not extrapolated full counts.
    sampled:
      collection.pullRequestContributions.pageInfo.hasNextPage ||
      collection.pullRequestReviewContributions.pageInfo.hasNextPage ||
      collection.issueContributions.pageInfo.hasNextPage ||
      collection.commitContributionsByRepository.length === 100 ||
      collection.commitContributionsByRepository.some(
        (node) => node.contributions.pageInfo.hasNextPage
      ),
  };
}
