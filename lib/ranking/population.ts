import { getRedisClient } from '../cache/redis';
import type { AggregatedStats } from '../github/types';
import { calculateRank, getTier, getDivision, calculateGP } from './engine';
import type { RankResult } from './types';

export const POPULATION_VERSION = 'v4';
export const POPULATION_MAX_AGE_MS = 30 * 86400_000;

// One entry per case-insensitive account and season. Atomic removal, upsert and
// comparison prevent duplicate visits/themes and concurrent requests adding votes.
export const UPDATE_POPULATION = `
local stale = redis.call('ZRANGEBYSCORE', KEYS[2], '-inf', ARGV[4])
for _, member in ipairs(stale) do
  redis.call('ZREM', KEYS[1], member)
  redis.call('ZREM', KEYS[2], member)
end
local previous = redis.call('ZSCORE', KEYS[2], ARGV[1])
if not previous or tonumber(previous) <= tonumber(ARGV[3]) then
  redis.call('ZADD', KEYS[1], ARGV[2], ARGV[1])
  redis.call('ZADD', KEYS[2], ARGV[3], ARGV[1])
end
redis.call('EXPIRE', KEYS[1], 2678400)
redis.call('EXPIRE', KEYS[2], 2678400)
return {redis.call('ZCOUNT', KEYS[1], '-inf', '(' .. ARGV[2]), redis.call('ZCARD', KEYS[1])}
`;

// Lower-bound percentile: tied accounts do not outrank one another, including
// zero-contribution accounts. Thresholds match the published gaming tiers.
export const PERCENTILE_BANDS = [
  [0, 0],
  [5, 600],
  [15, 900],
  [40, 1200],
  [65, 1500],
  [80, 1700],
  [90, 2000],
  [97, 2400],
  [99, 2600],
  [99.9, 3000],
  [100, 3200],
] as const;

export function rankAgainstPopulation(
  rank: RankResult,
  below: number,
  size: number
): RankResult {
  if (
    !Number.isInteger(size) ||
    size < 1 ||
    !Number.isInteger(below) ||
    below < 0 ||
    below >= size
  )
    return rank;
  const percentile = (100 * below) / size;
  let band = 0;
  while (
    band < PERCENTILE_BANDS.length - 2 &&
    percentile >= PERCENTILE_BANDS[band + 1][0]
  )
    band++;
  const [start, min] = PERCENTILE_BANDS[band];
  const [end, max] = PERCENTILE_BANDS[band + 1];
  // Floor avoids rounding a user across a tier's percentile boundary.
  const elo = Math.floor(
    min + ((max - min) * (percentile - start)) / (end - start)
  );
  const tier = getTier(elo);
  const division = getDivision(elo, tier);
  return {
    ...rank,
    elo,
    tier,
    division,
    gp: calculateGP(elo, tier, division),
    percentile,
    populationSize: size,
  };
}

export async function calculatePopulationRank(
  username: string,
  stats: AggregatedStats,
  season: number | 'all' = 'all',
  observedAt = Date.now()
): Promise<RankResult> {
  const rank = { ...calculateRank(stats), populationSize: 0 };
  const redis = getRedisClient();
  if (!redis) return rank; // Still award a game rank during a cache outage.
  try {
    const key = `population:${POPULATION_VERSION}:${season}`;
    const result = await redis.eval<(string | number)[], [number, number]>(
      UPDATE_POPULATION,
      [key, `${key}:observed`],
      [
        stats.userId ?? username.toLowerCase(),
        rank.wpi,
        observedAt,
        Date.now() - POPULATION_MAX_AGE_MS,
      ]
    );
    return rankAgainstPopulation(rank, Number(result[0]), Number(result[1]));
  } catch {
    console.error(
      '[Population] Comparison unavailable; using score-based game rank'
    );
    return rank;
  }
}
