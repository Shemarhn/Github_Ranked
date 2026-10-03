import { afterEach, describe, expect, it, vi } from 'vitest';
import { discoverSample } from '@/lib/github/sampling';
const { draw } = vi.hoisted(() => ({ draw: vi.fn() }));
vi.mock('node:crypto', () => ({ randomInt: draw }));

describe('Public account sampling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });
  it('accepts inactive human accounts, rejects gaps and organizations, and deduplicates', async () => {
    draw
      .mockReturnValueOnce(20)
      .mockReturnValueOnce(30)
      .mockReturnValueOnce(40)
      .mockReturnValueOnce(40)
      .mockReturnValueOnce(50);
    const fetcher = vi.fn();
    for (const response of [
      { items: [{ id: 100 }] },
      [{ id: 21, login: 'gap', type: 'User' }],
      [{ id: 30, login: 'org', type: 'Organization' }],
      [{ id: 40, login: 'Inactive', type: 'User' }],
      [{ id: 40, login: 'inactive', type: 'User' }],
      [{ id: 50, login: 'active', type: 'User' }],
    ])
      fetcher.mockResolvedValueOnce({ ok: true, json: async () => response });
    vi.stubGlobal('fetch', fetcher);
    expect(await discoverSample('fixture', 5, 2)).toEqual([
      'inactive',
      'active',
    ]);
    expect(draw).toHaveBeenCalledWith(1, 101);
    expect(fetcher.mock.calls[1][0]).toContain('since=19&per_page=1');
  });
  it('stops on GitHub failures without substituting selected popular profiles', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );
    await expect(discoverSample('fixture')).rejects.toThrow('403');
  });
  it('rejects invalid bounds rather than sampling an invented population', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) })
    );
    await expect(discoverSample('fixture')).rejects.toThrow(
      'Invalid population'
    );
  });
});
