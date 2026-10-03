import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis';
import { setCachedRank } from '@/lib/cache';
import { discoverSample } from '@/lib/github/sampling';
import { aggregateAllTimeStatsExtended } from '@/lib/github/aggregator';
import { calculatePopulationRank } from '@/lib/ranking/population';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Vercel cron (or an authorized manual run). Never accepts caller-supplied scores. */
export async function GET(request: NextRequest) {
  const reply = (body: object, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { 'Cache-Control': 'no-store' },
    });
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  )
    return reply({ error: 'Unauthorized' }, 401);
  const redis = getRedisClient();
  const token = process.env.GITHUB_TOKEN_1;
  if (!redis || !token)
    return reply(
      { error: 'Sampling requires GitHub and Redis configuration' },
      503
    );
  const lockKey = 'population:v4:sampling-lock';
  const lockId = randomUUID();
  let locked = false;
  let cached = 0;
  try {
    locked = Boolean(await redis.set(lockKey, lockId, { nx: true, ex: 300 }));
    if (!locked) return reply({ skipped: 'Sampling is already running' });
    const usernames = await discoverSample(token);
    const year = new Date().getUTCFullYear();
    for (const username of usernames) {
      const stats = await aggregateAllTimeStatsExtended(username);
      const rank = await calculatePopulationRank(username, stats);
      if (!rank.populationSize || !(await setCachedRank(username, rank, stats)))
        throw new Error('Population storage unavailable');
      cached++;
      const annual = stats.yearlyBreakdown.find((item) => item.year === year);
      const seasonStats = {
        ...stats,
        totalCommits: annual?.commits ?? 0,
        totalMergedPRs: annual?.prs ?? 0,
        totalCodeReviews: annual?.reviews ?? 0,
        totalIssuesClosed: annual?.issues ?? 0,
        totalStars: 0,
        totalFollowers: 0,
        firstContributionYear: year,
        lastContributionYear: year,
        yearsActive: 1,
      };
      const seasonRank = await calculatePopulationRank(
        username,
        seasonStats,
        year
      );
      if (
        !seasonRank.populationSize ||
        !(await setCachedRank(username, seasonRank, seasonStats, {
          season: year,
        }))
      )
        throw new Error('Season population storage unavailable');
    }
    return reply({ sampled: usernames.length, cached });
  } catch {
    console.error('[Population] Sampling failed; completed profiles retained');
    return reply({ error: 'Population sampling failed', cached }, 502);
  } finally {
    if (locked)
      await redis
        .eval(
          "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
          [lockKey],
          [lockId]
        )
        .catch(() => {});
  }
}
