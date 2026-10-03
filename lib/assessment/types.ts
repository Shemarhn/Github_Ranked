export const ALGORITHM_VERSION = '2.0.0';

export interface EvidenceEvent {
  id: string;
  kind: 'merged_pr' | 'commit_day' | 'review';
  repository: string;
  occurredAt: string;
  url: string;
  /** Author of the reviewed PR; never count self-reviews. */
  counterpart?: string;
}

export interface EvidenceSnapshot {
  username: string;
  from: string;
  to: string;
  fetchedAt: string;
  events: EvidenceEvent[];
  complete: boolean;
  limitations: string[];
}

export const DIMENSIONS = [
  'correctness',
  'judgment',
  'ownership',
  'collaboration',
  'impact',
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** Maintainer-curated rubric assessments; never accepted from public requests. */
export interface WorkReview {
  username: string;
  artifact: string;
  dimension: Dimension;
  reviewer: string;
  score: number;
  evidenceUrl: string;
  rationale: string;
  reviewedAt: string;
}

export interface QualityDimension {
  dimension: Dimension;
  score: number | null;
  artifacts: number;
  reviewers: number;
  status: 'assessed' | 'insufficient_evidence' | 'reviewer_disagreement';
  observations: WorkReview[];
}

export interface Assessment {
  version: string;
  snapshot: EvidenceSnapshot;
  contribution: {
    score: number | null;
    tier: string;
    deliveryUnits: number;
    reviewUnits: number;
    activeMonths: number;
    evidenceStatus: 'limited' | 'sufficient' | 'incomplete';
    repeatedCounterpartShare: number | null;
  };
  quality: {
    score: number | null;
    dimensions: QualityDimension[];
    status: 'assessed' | 'insufficient_evidence';
  };
}
