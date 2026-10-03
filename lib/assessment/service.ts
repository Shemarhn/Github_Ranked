import { z } from 'zod';
import { redisGet, redisSet } from '@/lib/cache/redis';
import curatedReviews from '@/data/work-reviews.json';
import { validateUsername } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';
import { collectEvidence, evidenceWindow } from './collector';
import { assessEvidence } from './engine';
import { ALGORITHM_VERSION, DIMENSIONS } from './types';

const snapshotSchema = z.object({
  username: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  fetchedAt: z.string().datetime(),
  complete: z.boolean(),
  limitations: z.array(z.string()),
  events: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['merged_pr', 'commit_day', 'review']),
      repository: z.string(),
      occurredAt: z.string().datetime(),
      url: z.string().url(),
      counterpart: z.string().optional(),
    })
  ),
});

const reviewSchema = z.array(
  z
    .object({
      username: z.string(),
      artifact: z.string(),
      dimension: z.enum(DIMENSIONS),
      reviewer: z.string(),
      score: z.number().int().min(0).max(4),
      evidenceUrl: z.string().url(),
      rationale: z.string().min(40),
      reviewedAt: z.string().datetime(),
    })
    .strict()
);
const reviews = reviewSchema.parse(curatedReviews);
const pending = new Map<string, ReturnType<typeof collectEvidence>>();

export async function getAssessment(
  username: string,
  options: { season?: number; force?: boolean; now?: Date } = {}
) {
  if (!validateUsername(username))
    throw new ValidationError('Invalid GitHub username');
  const login = username.toLowerCase();
  const now = options.now ?? new Date();
  const { from } = evidenceWindow(now, options.season);
  const key = `assessment:${ALGORITHM_VERSION}:${login}:${options.season ?? 'recent'}:${from.toISOString().slice(0, 7)}`;
  if (!options.force) {
    const parsed = snapshotSchema.safeParse(await redisGet<unknown>(key));
    const cached = parsed.success ? parsed.data : null;
    if (
      cached?.username === login &&
      cached.from === from.toISOString() &&
      Date.parse(cached.to) <= now.getTime() &&
      Array.isArray(cached.events) &&
      typeof cached.complete === 'boolean' &&
      Date.parse(cached.fetchedAt) <= now.getTime() &&
      now.getTime() - Date.parse(cached.fetchedAt) < 3600_000
    ) {
      // Recompute with current curated reviews; never persist stale quality scores.
      return assessEvidence(cached, reviews, now.toISOString());
    }
  }
  let collecting = pending.get(key);
  if (!collecting) {
    collecting = collectEvidence(login, now, options.season);
    pending.set(key, collecting);
  }
  try {
    const snapshot = await collecting;
    if (snapshot.complete) await redisSet(key, snapshot, 3600);
    return assessEvidence(snapshot, reviews, now.toISOString());
  } finally {
    if (pending.get(key) === collecting) pending.delete(key);
  }
}
