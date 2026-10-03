import { describe, expect, it } from 'vitest';
import {
  groupedCredit,
  scorePublicContributions,
  type PublicContributions,
} from '@/lib/github/contributionScore';
import { calculateRank, calculateWPI } from '@/lib/ranking/engine';
import { scoreBreakdown } from '@/lib/ranking/scoring';

const zero = {
  totalCommits: 0,
  totalMergedPRs: 0,
  totalCodeReviews: 0,
  totalIssuesClosed: 0,
  totalStars: 0,
  totalFollowers: 0,
  firstContributionYear: 2026,
  lastContributionYear: 2026,
  yearsActive: 0,
};
const repo = (owner = 'team', isPrivate = false) => ({
  owner: { login: owner },
  isPrivate,
});
const pr = (id = 'PR1', author = 'alice', owner = 'team') => ({
  id,
  merged: true,
  author: { login: author, __typename: 'User' },
  mergedBy: { login: 'merger' },
  repository: repo(owner),
});
const connection = <T>(nodes: T[]) => ({
  nodes,
  pageInfo: { hasNextPage: false },
});
const empty = (): PublicContributions => ({
  commitContributionsByRepository: [],
  pullRequestContributions: connection([]),
  pullRequestReviewContributions: connection([]),
  issueContributions: connection([]),
});

describe('Gaming rank abuse resistance', () => {
  it('always gives a new or publicly inactive profile Iron IV', () => {
    expect(calculateRank(zero)).toMatchObject({
      tier: 'Iron',
      division: 'IV',
      elo: 0,
    });
  });
  it('limits repetitive interactions without accusing or excluding small teams', () => {
    expect(groupedCredit(Array(10).fill('friend'))).toBe(10);
    expect(groupedCredit(Array(100).fill('friend'))).toBeLessThan(20);
    expect(groupedCredit(['Friend', 'friend'])).toBe(2);
    expect(
      groupedCredit(Array.from({ length: 100 }, (_, i) => `peer${i}`))
    ).toBe(100);
  });
  it('counts merged PRs once and rejects private/unmerged PRs', () => {
    const data = empty();
    data.pullRequestContributions = connection([
      { pullRequest: pr() },
      { pullRequest: pr() },
      { pullRequest: { ...pr('open'), merged: false } },
      { pullRequest: { ...pr('secret'), repository: repo('team', true) } },
    ]);
    expect(scorePublicContributions(data, 'viewer').prs).toBe(1);
  });
  it('does not reward self, bot, pending, dismissed or repeated reviews', () => {
    const data = empty();
    data.pullRequestReviewContributions = connection([
      { pullRequest: pr(), pullRequestReview: { state: 'APPROVED' } },
      { pullRequest: pr(), pullRequestReview: { state: 'COMMENTED' } },
      {
        pullRequest: pr('self', 'VIEWER'),
        pullRequestReview: { state: 'APPROVED' },
      },
      {
        pullRequest: {
          ...pr('bot'),
          author: { login: 'bot', __typename: 'Bot' },
        },
        pullRequestReview: { state: 'APPROVED' },
      },
      { pullRequest: pr('pending'), pullRequestReview: { state: 'PENDING' } },
      {
        pullRequest: pr('dismissed'),
        pullRequestReview: { state: 'DISMISSED' },
      },
    ]);
    expect(scorePublicContributions(data, 'viewer').reviews).toBe(1);
  });
  it('dampens reciprocal pairs even if they spread PRs across different owners', () => {
    const data = empty();
    data.pullRequestContributions = connection(
      Array.from({ length: 100 }, (_, i) => ({
        pullRequest: pr(`pr${i}`, 'alice', `owner${i}`),
      }))
    );
    data.pullRequestReviewContributions = connection(
      Array.from({ length: 100 }, (_, i) => ({
        pullRequest: pr(`review${i}`, 'friend', `owner${i}`),
        pullRequestReview: { state: 'APPROVED' },
      }))
    );
    const score = scorePublicContributions(data, 'alice');
    expect(score.prs).toBeLessThan(20);
    expect(score.reviews).toBeLessThan(20);
  });
  it('keeps commit splitting under the same owner equivalent and ignores private work', () => {
    const data = empty();
    data.commitContributionsByRepository = [
      {
        repository: repo(),
        contributions: {
          nodes: [{ commitCount: 10000 }],
          pageInfo: { hasNextPage: false },
        },
      },
    ];
    const first = scorePublicContributions(data, 'alice').commits;
    data.commitContributionsByRepository = Array.from({ length: 100 }, () => ({
      repository: repo('TEAM'),
      contributions: {
        nodes: [{ commitCount: 100 }],
        pageInfo: { hasNextPage: false },
      },
    }));
    data.commitContributionsByRepository.push({
      repository: repo('private', true),
      contributions: {
        nodes: [{ commitCount: 100000 }],
        pageInfo: { hasNextPage: false },
      },
    });
    expect(scorePublicContributions(data, 'alice').commits).toBe(first);
    expect(first).toBeLessThan(200);
  });
  it('counts closed authored issues and marks truncated evidence', () => {
    const data = empty();
    data.issueContributions = connection([
      { issue: { id: '1', closed: true, repository: repo() } },
      { issue: { id: '2', closed: false, repository: repo() } },
    ]);
    data.issueContributions.pageInfo.hasNextPage = true;
    expect(scorePublicContributions(data, 'alice')).toMatchObject({
      issues: 1,
      sampled: true,
    });
  });
  it('has diminishing gains and finite scores, with caps on commits and stars', () => {
    const a = calculateWPI({ ...zero, totalMergedPRs: 50 });
    const b = calculateWPI({ ...zero, totalMergedPRs: 100 });
    expect(b - a).toBeLessThan(a);
    expect(
      calculateWPI({ ...zero, totalCommits: 10000, totalStars: 1000 })
    ).toBe(calculateWPI({ ...zero, totalCommits: 1e9, totalStars: 1e9 }));
    expect(
      calculateWPI({ ...zero, totalCodeReviews: NaN, totalMergedPRs: -100 })
    ).toBe(1);
    const scores = scoreBreakdown({
      ...zero,
      totalCommits: 100,
      totalMergedPRs: 10,
    });
    expect(
      calculateWPI({ ...zero, totalCommits: 100, totalMergedPRs: 10 })
    ).toBeCloseTo(
      Object.values(scores).reduce((a, b) => a + b),
      2
    );
  });
});
