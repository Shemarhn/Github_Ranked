import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAssessment } from '@/lib/assessment/service';
import { collectEvidence } from '@/lib/assessment/collector';
import { redisGet, redisSet } from '@/lib/cache/redis';
import type { EvidenceSnapshot } from '@/lib/assessment/types';
vi.mock('@/lib/cache/redis', () => ({ redisGet: vi.fn(), redisSet: vi.fn() }));
vi.mock('@/lib/assessment/collector', async (original) => ({
  ...(await original<typeof import('@/lib/assessment/collector')>()),
  collectEvidence: vi.fn(),
}));
const now = new Date('2026-10-02T12:00:00Z');
const snapshot: EvidenceSnapshot = {
  username: 'dev',
  from: '2025-11-01T00:00:00.000Z',
  to: now.toISOString(),
  fetchedAt: now.toISOString(),
  events: [],
  complete: true,
  limitations: [],
};
describe('assessment cache isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(redisGet).mockResolvedValue(null);
    vi.mocked(collectEvidence).mockResolvedValue(snapshot);
  });
  it('uses a case-normalized versioned namespace and shared cache for badge/dashboard', async () => {
    await getAssessment('DEV', { now });
    expect(redisGet).toHaveBeenCalledWith(
      'assessment:2.0.0:dev:recent:2025-11'
    );
    expect(redisSet).toHaveBeenCalledWith(
      'assessment:2.0.0:dev:recent:2025-11',
      snapshot,
      3600
    );
  });
  it('reuses fresh snapshots without re-querying GitHub', async () => {
    vi.mocked(redisGet).mockResolvedValue(snapshot);
    await getAssessment('dev', { now });
    expect(collectEvidence).not.toHaveBeenCalled();
  });
  it.each([
    { bad: true },
    { ...snapshot, events: [null] },
    { ...snapshot, fetchedAt: '2026-09-01T00:00:00.000Z' },
    { ...snapshot, username: 'other' },
  ])('ignores malformed, stale, or mismatched cached data', async (cached) => {
    vi.mocked(redisGet).mockResolvedValue(cached);
    await getAssessment('dev', { now });
    expect(collectEvidence).toHaveBeenCalledOnce();
  });
  it('bypasses cache on force and does not cache truncated results', async () => {
    vi.mocked(collectEvidence).mockResolvedValue({
      ...snapshot,
      complete: false,
    });
    await getAssessment('dev', { now, force: true });
    expect(redisGet).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
  });
  it('coalesces concurrent requests and clears rejected requests for retry', async () => {
    await Promise.all([
      getAssessment('dev', { now }),
      getAssessment('DEV', { now }),
    ]);
    expect(collectEvidence).toHaveBeenCalledOnce();
    vi.mocked(collectEvidence).mockRejectedValueOnce(new Error('Unavailable'));
    await expect(getAssessment('dev', { now })).rejects.toThrow('Unavailable');
    await expect(getAssessment('dev', { now })).resolves.toBeDefined();
  });
});
