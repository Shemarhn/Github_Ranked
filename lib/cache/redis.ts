/**
 * Redis Client
 * Upstash Redis HTTP-based client for Edge Runtime compatibility
 */

import { Redis } from '@upstash/redis';

/**
 * Redis client instance.
 * Uses Upstash REST API for Edge Runtime compatibility.
 */
let redisClient: Redis | null = null;

/**
 * Check if Redis is configured in environment.
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Get or create Redis client instance.
 * Returns null if Redis is not configured.
 *
 * @returns Redis client or null
 */
export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return redisClient;
}

/**
 * Reset Redis client (for testing).
 */
export function resetRedisClient(): void {
  redisClient = null;
}

/**
 * Get a value from Redis.
 *
 * @param key - Cache key
 * @returns Value or null if not found/error
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error('[Redis] GET error:', error);
    return null;
  }
}

/**
 * Set a value in Redis with TTL.
 *
 * @param key - Cache key
 * @param value - Value to store
 * @param ttlSeconds - Time-to-live in seconds
 * @returns true if successful, false otherwise
 */
export async function redisSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error('[Redis] SET error:', error);
    return false;
  }
}

/**
 * Delete a key from Redis.
 *
 * @param key - Cache key
 * @returns true if successful, false otherwise
 */
export async function redisDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] DEL error:', error);
    return false;
  }
}

/**
 * Check if a key exists in Redis.
 *
 * @param key - Cache key
 * @returns true if exists, false otherwise
 */
export async function redisExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    console.error('[Redis] EXISTS error:', error);
    return false;
  }
}

/**
 * Get remaining TTL for a key.
 *
 * @param key - Cache key
 * @returns TTL in seconds, -1 if no expiry, -2 if not found, null on error
 */
export async function redisTTL(key: string): Promise<number | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const ttl = await client.ttl(key);
    return ttl;
  } catch (error) {
    console.error('[Redis] TTL error:', error);
    return null;
  }
}

/**
 * Ping Redis to check connection.
 *
 * @returns true if connected, false otherwise
 */
export async function redisPing(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('[Redis] PING error:', error);
    return false;
  }
}
