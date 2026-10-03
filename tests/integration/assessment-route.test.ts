import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as badge } from '@/app/api/rank/[username]/route';
import { GET as json } from '@/app/api/assessment/[username]/route';
import { getAssessment } from '@/lib/assessment/service';
import { assessEvidence } from '@/lib/assessment/engine';
import { GitHubAPIError, UserNotFoundError } from '@/lib/utils/errors';
vi.mock('@/lib/assessment/service', () => ({ getAssessment: vi.fn() }));
const result = () =>
  assessEvidence({
    username: 'dev',
    from: '2026-01-01T00:00:00.000Z',
    to: '2026-01-31T00:00:00.000Z',
    fetchedAt: '2026-01-31T00:00:00.000Z',
    events: [],
    complete: true,
    limitations: [],
  });
const params = () => ({ params: Promise.resolve({ username: 'dev' }) });
describe('v2 public API routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAssessment).mockResolvedValue(result());
  });
  it('returns an explicitly labelled SVG instead of an unsupported skill percentile', async () => {
    const response = await badge(
      new NextRequest('http://localhost/api/rank/dev?theme=light'),
      params()
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
    expect(response.headers.get('X-Algorithm-Version')).toBe('2.0.0');
    expect(await response.text()).toContain('Unrated');
  });
  it('exposes provenance and missing dimensions in JSON', async () => {
    const response = await json(
      new NextRequest('http://localhost/api/assessment/dev'),
      params()
    );
    expect(await response.json()).toEqual(result());
  });
  it('preserves theme, season and refresh parameters', async () => {
    await badge(
      new NextRequest('http://localhost/api/rank/dev?season=2024&force=true'),
      params()
    );
    expect(getAssessment).toHaveBeenCalledWith('dev', {
      season: 2024,
      force: true,
    });
  });
  it.each(['', 'NaN', '2024.5', '1e3'])(
    'rejects malformed season %s',
    async (season) => {
      const response = await badge(
        new NextRequest(`http://localhost/api/rank/dev?season=${season}`),
        params()
      );
      expect(response.status).toBe(400);
      expect(getAssessment).not.toHaveBeenCalled();
    }
  );
  it('never caches errors or incomplete evidence', async () => {
    vi.mocked(getAssessment).mockRejectedValueOnce(
      new GitHubAPIError('Authentication failed', { statusCode: 401 })
    );
    const failed = await badge(
      new NextRequest('http://localhost/api/rank/dev'),
      params()
    );
    expect(failed.status).toBe(502);
    expect(failed.headers.get('Cache-Control')).toBe('no-store');
    vi.mocked(getAssessment).mockResolvedValue({
      ...result(),
      snapshot: { ...result().snapshot, complete: false },
    });
    expect(
      (
        await badge(new NextRequest('http://localhost/api/rank/dev'), params())
      ).headers.get('Cache-Control')
    ).toBe('no-store');
  });
  it('returns 404 for a missing user', async () => {
    vi.mocked(getAssessment).mockRejectedValue(new UserNotFoundError('dev'));
    expect(
      (
        await json(
          new NextRequest('http://localhost/api/assessment/dev'),
          params()
        )
      ).status
    ).toBe(404);
  });
});
