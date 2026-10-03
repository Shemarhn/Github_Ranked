import {
  ALGORITHM_VERSION,
  DIMENSIONS,
  type Assessment,
  type EvidenceEvent,
  type EvidenceSnapshot,
  type QualityDimension,
  type WorkReview,
} from './types';

const round = (n: number) => Math.round(n * 10) / 10;
const mean = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;
const key = (...parts: string[]) => JSON.stringify(parts);

export function isPublicEvidenceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.split('/').length >= 4
    );
  } catch {
    return false;
  }
}

/** Missing dimensions stay null. Neither activity nor popularity supplies quality. */
export function assessQuality(
  username: string,
  reviews: WorkReview[],
  asOf: string
) {
  if (!Number.isFinite(Date.parse(asOf)))
    throw new Error('Invalid assessment date');
  const seen = new Set<string>();
  const artifactForCitation = new Map<string, string>();
  const valid = reviews.filter((review) => {
    const id = key(
      review.artifact,
      review.dimension,
      review.reviewer.toLowerCase()
    );
    if (
      review.username.toLowerCase() !== username.toLowerCase() ||
      review.reviewer.toLowerCase() === username.toLowerCase() ||
      !review.reviewer.trim() ||
      review.reviewer !== review.reviewer.trim() ||
      !review.artifact.trim() ||
      review.artifact !== review.artifact.trim() ||
      !DIMENSIONS.includes(review.dimension) ||
      !Number.isInteger(review.score) ||
      review.score < 0 ||
      review.score > 4 ||
      !isPublicEvidenceUrl(review.evidenceUrl) ||
      review.rationale.trim().length < 40 ||
      !Number.isFinite(Date.parse(review.reviewedAt)) ||
      Date.parse(review.reviewedAt) > Date.parse(asOf)
    ) {
      throw new Error('Invalid curated work review');
    }
    if (seen.has(id))
      throw new Error('Duplicate artifact/dimension/reviewer assessment');
    const citation = new URL(review.evidenceUrl);
    const canonicalCitation =
      citation.origin + citation.pathname.replace(/\/$/, '');
    const priorArtifact = artifactForCitation.get(canonicalCitation);
    if (priorArtifact && priorArtifact !== review.artifact) {
      throw new Error(
        'The same cited work cannot be counted as different artifacts'
      );
    }
    artifactForCitation.set(canonicalCitation, review.artifact);
    seen.add(id);
    return true;
  });
  const dimensions: QualityDimension[] = DIMENSIONS.map((dimension) => {
    const observations = valid.filter((r) => r.dimension === dimension);
    const groups = new Map<string, WorkReview[]>();
    for (const r of observations)
      groups.set(r.artifact, [...(groups.get(r.artifact) ?? []), r]);
    const paired = [...groups.values()].filter((group) => group.length >= 2);
    const disputed = paired.some(
      (group) =>
        Math.max(...group.map((r) => r.score)) -
          Math.min(...group.map((r) => r.score)) >
        1
    );
    const status = disputed
      ? 'reviewer_disagreement'
      : paired.length < 3
        ? 'insufficient_evidence'
        : 'assessed';
    return {
      dimension,
      status,
      artifacts: paired.length,
      reviewers: new Set(observations.map((r) => r.reviewer.toLowerCase()))
        .size,
      score:
        status === 'assessed'
          ? round(mean(paired.map((g) => mean(g.map((r) => r.score)))) * 25)
          : null,
      observations,
    };
  });
  const assessed = dimensions.every((d) => d.score !== null);
  // Equal weight geometric mean: strengths cannot fully conceal a weak dimension.
  const score = assessed
    ? round(
        Math.pow(
          dimensions.reduce((p, d) => p * (d.score! / 100), 1),
          1 / dimensions.length
        ) * 100
      )
    : null;
  return {
    score,
    dimensions,
    status: assessed
      ? ('assessed' as const)
      : ('insufficient_evidence' as const),
  };
}

export function assessEvidence(
  snapshot: EvidenceSnapshot,
  reviews: WorkReview[] = [],
  assessedAt = snapshot.fetchedAt
): Assessment {
  const from = Date.parse(snapshot.from);
  const to = Date.parse(snapshot.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to)
    throw new Error('Invalid evidence window');
  const seen = new Set<string>();
  const events: EvidenceEvent[] = [...snapshot.events]
    .sort(
      (a, b) =>
        a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)
    )
    .filter((event) => {
      const time = Date.parse(event.occurredAt);
      if (
        !event.id ||
        !event.repository ||
        !Number.isFinite(time) ||
        time < from ||
        time > to ||
        !isPublicEvidenceUrl(event.url) ||
        !['merged_pr', 'commit_day', 'review'].includes(event.kind) ||
        (event.kind === 'review' &&
          (!event.counterpart ||
            event.counterpart.toLowerCase() ===
              snapshot.username.toLowerCase()))
      )
        return false;
      const id = key(event.kind, event.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort(
      (a, b) =>
        a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id)
    );

  const delivery = new Map<string, Set<string>>();
  const reviewGroups = new Map<string, Map<string, Set<string>>>();
  const months = new Set<string>();
  const counterparts = new Map<string, Set<string>>();
  for (const event of events) {
    const date = new Date(event.occurredAt).toISOString();
    const month = date.slice(0, 7);
    months.add(month);
    if (event.kind === 'review') {
      const actor = event.counterpart!.toLowerCase();
      const groups = reviewGroups.get(month) ?? new Map<string, Set<string>>();
      const prs = groups.get(actor) ?? new Set<string>();
      prs.add(event.id);
      groups.set(actor, prs);
      reviewGroups.set(month, groups);
      const all = counterparts.get(actor) ?? new Set<string>();
      all.add(event.id);
      counterparts.set(actor, all);
    } else {
      // PRs and commits on the same day are one delivery observation; splitting
      // commits/PRs or creating more repositories cannot increase this credit.
      const days = delivery.get(month) ?? new Set<string>();
      days.add(date.slice(0, 10));
      delivery.set(month, days);
    }
  }
  const deliveryUnits = [...delivery.values()].reduce(
    (sum, days) => sum + Math.min(3, days.size),
    0
  );
  const reviewUnits = [...reviewGroups.values()].reduce(
    (sum, actors) =>
      sum +
      Math.min(
        3,
        [...actors.values()].reduce((n, prs) => n + Math.min(1, prs.size), 0)
      ),
    0
  );
  const activeMonths = months.size;
  const totalReviews = [...counterparts.values()].reduce(
    (sum, prs) => sum + prs.size,
    0
  );
  const repeatedCounterpartShare = totalReviews
    ? round(
        (Math.max(...[...counterparts.values()].map((prs) => prs.size)) /
          totalReviews) *
          100
      )
    : null;
  // Alternative tracks avoid penalizing solo delivery or review-focused work.
  // These are explicit policy anchors, not fitted population statistics.
  const breadth = Math.max(deliveryUnits, reviewUnits);
  const limited = activeMonths < 3 || breadth < 6;
  const score =
    snapshot.complete && !limited
      ? round(
          80 * (1 - Math.exp(-breadth / 12)) +
            20 * Math.min(activeMonths / 6, 1)
        )
      : null;
  const tiers = [
    'Iron',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Emerald',
    'Diamond',
    'Master',
    'Grandmaster',
    'Challenger',
  ];
  return {
    version: ALGORITHM_VERSION,
    snapshot: { ...snapshot, events },
    contribution: {
      score,
      tier:
        score === null ? 'Unrated' : tiers[Math.min(9, Math.floor(score / 10))],
      deliveryUnits,
      reviewUnits,
      activeMonths,
      evidenceStatus: !snapshot.complete
        ? 'incomplete'
        : limited
          ? 'limited'
          : 'sufficient',
      repeatedCounterpartShare,
    },
    quality: assessQuality(
      snapshot.username,
      reviews.filter(
        (r) => r.username.toLowerCase() === snapshot.username.toLowerCase()
      ),
      assessedAt
    ),
  };
}
