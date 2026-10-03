import { describe, expect, it } from 'vitest';
import { assessEvidence, assessQuality } from '@/lib/assessment/engine';
import { assessmentBadge } from '@/lib/assessment/badge';
import { evidenceWindow } from '@/lib/assessment/collector';
import {
  DIMENSIONS,
  type EvidenceEvent,
  type EvidenceSnapshot,
  type WorkReview,
} from '@/lib/assessment/types';
import { THEMES } from '@/lib/renderer/themes';

const now = '2026-10-02T12:00:00.000Z';
const event = (
  month = 1,
  day = 1,
  kind: EvidenceEvent['kind'] = 'commit_day',
  counterpart = 'peer'
): EvidenceEvent => ({
  id: `${month}:${day}:${kind}:${counterpart}`,
  kind,
  counterpart,
  repository: 'dev/project',
  occurredAt: new Date(Date.UTC(2026, month - 1, day)).toISOString(),
  url: `https://github.com/dev/project/pull/${month * 100 + day}`,
});
const snapshot = (events: EvidenceEvent[] = []): EvidenceSnapshot => ({
  username: 'dev',
  from: '2025-11-01T00:00:00.000Z',
  to: now,
  fetchedAt: now,
  events,
  complete: true,
  limitations: [],
});
const regular = (kind: EvidenceEvent['kind'] = 'commit_day') =>
  Array.from({ length: 6 }, (_, m) =>
    Array.from({ length: 3 }, (_, d) => event(m + 1, d + 1, kind, `peer${d}`))
  ).flat();
const workReviews = (): WorkReview[] =>
  DIMENSIONS.flatMap((dimension) =>
    [1, 2, 3].flatMap((artifact) =>
      ['alice', 'bob'].map((reviewer) => ({
        username: 'dev',
        artifact: `change-${artifact}`,
        dimension,
        reviewer,
        score: 3,
        evidenceUrl: `https://github.com/dev/project/pull/${artifact}`,
        rationale:
          'Inspected the linked change and its surrounding context against this rubric dimension.',
        reviewedAt: '2026-01-01T00:00:00.000Z',
      }))
    )
  );

describe('public contribution evidence algorithm', () => {
  it('leaves sparse and private-only profiles unrated rather than low-ranked', () => {
    for (const events of [[], [event()], [event(1), event(2), event(3)]]) {
      const result = assessEvidence(snapshot(events));
      expect(result.contribution.score).toBeNull();
      expect(result.contribution.tier).toBe('Unrated');
      expect(result.quality.score).toBeNull();
    }
  });
  it('gives solo contributors and review specialists equivalent alternative tracks', () => {
    const solo = assessEvidence(snapshot(regular()));
    const reviewer = assessEvidence(snapshot(regular('review')));
    expect(solo.contribution.score).toBe(82.1);
    expect(reviewer.contribution.score).toBe(solo.contribution.score);
  });
  it('does not reward commit splitting, same-day PRs, or repository proliferation', () => {
    const baseline = regular();
    const spam = baseline.flatMap((e) =>
      Array.from({ length: 100 }, (_, i) => ({
        ...e,
        id: `${e.id}-${i}`,
        repository: `dev/repo${i}`,
        kind: 'merged_pr' as const,
      }))
    );
    expect(
      assessEvidence(snapshot([...baseline, ...spam])).contribution.score
    ).toBe(assessEvidence(snapshot(baseline)).contribution.score);
  });
  it('caps bulk delivery at three days per month', () => {
    const spam = Array.from({ length: 6 }, (_, m) =>
      Array.from({ length: 28 }, (_, d) => event(m + 1, d + 1))
    ).flat();
    expect(assessEvidence(snapshot(spam)).contribution.deliveryUnits).toBe(18);
  });
  it('caps a reciprocal pair even if it creates hundreds of approvals', () => {
    const spam = Array.from({ length: 6 }, (_, m) =>
      Array.from({ length: 28 }, (_, d) => event(m + 1, d + 1, 'review'))
    ).flat();
    const result = assessEvidence(snapshot(spam));
    expect(result.contribution.reviewUnits).toBe(6);
    expect(result.contribution.score).toBeLessThan(60);
    expect(result.contribution.repeatedCounterpartShare).toBe(100);
    expect(result.quality.score).toBeNull();
  });
  it('caps many review accounts at three observations per month', () => {
    const spam = Array.from({ length: 6 }, (_, m) =>
      Array.from({ length: 28 }, (_, d) =>
        event(m + 1, d + 1, 'review', `peer${d}`)
      )
    ).flat();
    expect(assessEvidence(snapshot(spam)).contribution.reviewUnits).toBe(18);
  });
  it('excludes self reviews, malformed dates, out-of-window data, and unsafe links', () => {
    const ignored = [
      event(1, 1, 'review', 'DEV'),
      { ...event(), occurredAt: 'invalid' },
      { ...event(), occurredAt: '2027-01-01T00:00:00Z' },
      { ...event(), url: 'javascript:alert(1)' },
    ];
    expect(assessEvidence(snapshot(ignored)).snapshot.events).toEqual([]);
  });
  it('is deterministic under duplicate records and input reordering', () => {
    const events = regular('review');
    expect(assessEvidence(snapshot([...events, ...events].reverse()))).toEqual(
      assessEvidence(snapshot(events))
    );
  });
  it('never assigns a confident low rank to a truncated collection', () => {
    const result = assessEvidence({ ...snapshot(regular()), complete: false });
    expect(result.contribution.score).toBeNull();
    expect(result.contribution.evidenceStatus).toBe('incomplete');
  });
  it('is monotone and bounded as qualifying activity increases', () => {
    let previous = 0;
    for (let months = 3; months <= 9; months++) {
      const events = Array.from({ length: months }, (_, m) => [
        event(m + 1, 1),
        event(m + 1, 2),
        event(m + 1, 3),
      ]).flat();
      const value = assessEvidence(snapshot(events)).contribution.score!;
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeLessThanOrEqual(100);
      previous = value;
    }
  });
  it('uses UTC months and handles leap years without widening the window', () => {
    const window = evidenceWindow(new Date('2024-02-29T12:00:00Z'));
    expect(window.from.toISOString()).toBe('2023-03-01T00:00:00.000Z');
    expect(evidenceWindow(new Date(now), 2024).to.toISOString()).toBe(
      '2024-12-31T23:59:59.999Z'
    );
    expect(() => evidenceWindow(new Date(now), 2027)).toThrow();
  });
  it('does not reduce a historical assessment just because another year passed', () => {
    const first = assessEvidence(snapshot(regular()));
    const later = assessEvidence({
      ...snapshot(regular()),
      fetchedAt: '2027-01-01T00:00:00Z',
    });
    expect(later.contribution).toEqual(first.contribution);
  });
});

describe('reviewed engineering quality', () => {
  it('requires three independently double-reviewed samples in every dimension', () => {
    const reviews = workReviews();
    expect(assessQuality('dev', reviews, now).score).toBe(75);
    expect(
      assessQuality(
        'dev',
        reviews.filter((r) => r.dimension !== 'impact'),
        now
      ).score
    ).toBeNull();
    expect(
      assessQuality(
        'dev',
        reviews.filter((r) => r.artifact !== 'change-3'),
        now
      ).score
    ).toBeNull();
    expect(
      assessQuality(
        'dev',
        reviews.filter((r) => r.reviewer !== 'bob'),
        now
      ).score
    ).toBeNull();
  });
  it('withholds scores on material disagreement', () => {
    const reviews = workReviews();
    reviews[0].score = 0;
    const result = assessQuality('dev', reviews, now);
    expect(result.score).toBeNull();
    expect(result.dimensions[0].status).toBe('reviewer_disagreement');
  });
  it('cannot hide an evidenced weakness behind other high dimensions', () => {
    const reviews = workReviews().map((r) => ({
      ...r,
      score: r.dimension === 'correctness' ? 0 : 4,
    }));
    expect(assessQuality('dev', reviews, now).score).toBe(0);
  });
  it('gives equal weight to artifacts regardless of reviewer count', () => {
    const reviews = workReviews();
    reviews.push(
      ...reviews
        .filter((r) => r.artifact === 'change-1' && r.reviewer === 'alice')
        .map((r) => ({ ...r, reviewer: 'carol' }))
    );
    expect(assessQuality('dev', reviews, now).score).toBe(75);
  });
  it.each([
    { reviewer: 'DEV' },
    { score: NaN },
    { score: 4.5 },
    { score: -1 },
    { evidenceUrl: 'https://github.com.evil.test/x/y' },
    { reviewedAt: '2029-01-01T00:00:00.000Z' },
    { rationale: 'good' },
  ])('rejects invalid curated evidence %j', (patch) => {
    const reviews = workReviews();
    reviews[0] = { ...reviews[0], ...patch };
    expect(() => assessQuality('dev', reviews, now)).toThrow();
  });
  it('rejects duplicate assessments including reviewer case variants', () => {
    const reviews = workReviews();
    expect(() =>
      assessQuality(
        'dev',
        [...reviews, { ...reviews[0], reviewer: 'ALICE' }],
        now
      )
    ).toThrow('Duplicate');
  });

  it('rejects inflating sample size by renaming an artifact or changing URL fragments', () => {
    const reviews = workReviews();
    reviews.push({
      ...reviews[0],
      artifact: 'fake-extra-sample',
      evidenceUrl: reviews[0].evidenceUrl + '#different-line',
    });
    expect(() => assessQuality('dev', reviews, now)).toThrow(
      'different artifacts'
    );
  });
  it('does not decay old reviewed work or substitute activity for missing reviews', () => {
    expect(
      assessQuality('dev', workReviews(), '2030-01-01T00:00:00Z').score
    ).toBe(75);
    expect(assessEvidence(snapshot(regular())).quality.score).toBeNull();
  });
});

describe('self-contained badge', () => {
  it('escapes labels and supports every existing theme without remote assets', () => {
    const assessment = assessEvidence(snapshot(regular()));
    assessment.snapshot.username = '<script>&"';
    for (const theme of Object.keys(THEMES) as (keyof typeof THEMES)[]) {
      const svg = assessmentBadge(assessment, theme);
      expect(svg).toContain('&lt;script&gt;&amp;&quot;');
      expect(svg).not.toContain('<script>');
      expect(svg).not.toContain('<image');
      expect(svg).toContain('Public contributions');
      expect(svg).not.toContain('percentile');
    }
  });
});
