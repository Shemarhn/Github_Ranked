/**
 * Unit Tests for Redis Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock Redis instance
const mockRedisInstance = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  ttl: vi.fn(),
  ping: vi.fn(),
};

// Mock @upstash/redis before importing redis module
vi.mock('@upstash/redis', () => {
  return {
    Redis: class MockRedis {
      get = mockRedisInstance.get;
      set = mockRedisInstance.set;
      del = mockRedisInstance.del;
      exists = mockRedisInstance.exists;
      ttl = mockRedisInstance.ttl;
      ping = mockRedisInstance.ping;
    },
  };
});

import {
  getRedisClient,
  resetRedisClient,
  isRedisConfigured,
  redisGet,
  redisSet,
  redisDel,
  redisExists,
  redisTTL,
  redisPing,
} from '@/lib/cache/redis';
import { Redis } from '@upstash/redis';

describe('Redis Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isRedisConfigured', () => {
    it('should return true when both env vars are set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      expect(isRedisConfigured()).toBe(true);
    });

    it('should return false when URL is missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      expect(isRedisConfigured()).toBe(false);
    });

    it('should return false when token is missing', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      expect(isRedisConfigured()).toBe(false);
    });

    it('should return false when both are missing', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      expect(isRedisConfigured()).toBe(false);
    });
  });

  describe('getRedisClient', () => {
    it('should return null when not configured', () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const client = getRedisClient();
      expect(client).toBeNull();
    });

    it('should create client when configured', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      const client = getRedisClient();
      expect(client).not.toBeNull();
      expect(client).toBeInstanceOf(Redis);
    });

    it('should return same client instance on multiple calls', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(client1).toBe(client2);
    });
  });

  describe('redisGet', () => {
    it('should return null when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisGet('test-key');
      expect(result).toBeNull();
    });

    it('should return value when found', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.get.mockResolvedValue({ foo: 'bar' });

      const result = await redisGet<{ foo: string }>('test-key');
      expect(result).toEqual({ foo: 'bar' });
      expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await redisGet('test-key');
      expect(result).toBeNull();
    });
  });

  describe('redisSet', () => {
    it('should return false when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisSet('test-key', 'value', 3600);
      expect(result).toBe(false);
    });

    it('should set value with TTL', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.set.mockResolvedValue('OK');

      const result = await redisSet('test-key', { foo: 'bar' }, 3600);
      expect(result).toBe(true);
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'test-key',
        { foo: 'bar' },
        { ex: 3600 }
      );
    });

    it('should return false on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.set.mockRejectedValue(new Error('Connection failed'));

      const result = await redisSet('test-key', 'value', 3600);
      expect(result).toBe(false);
    });
  });

  describe('redisDel', () => {
    it('should return false when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisDel('test-key');
      expect(result).toBe(false);
    });

    it('should delete key', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.del.mockResolvedValue(1);

      const result = await redisDel('test-key');
      expect(result).toBe(true);
      expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.del.mockRejectedValue(new Error('Error'));

      const result = await redisDel('test-key');
      expect(result).toBe(false);
    });
  });

  describe('redisExists', () => {
    it('should return false when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisExists('test-key');
      expect(result).toBe(false);
    });

    it('should return true when key exists', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.exists.mockResolvedValue(1);

      const result = await redisExists('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.exists.mockResolvedValue(0);

      const result = await redisExists('test-key');
      expect(result).toBe(false);
    });
  });

  describe('redisTTL', () => {
    it('should return null when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisTTL('test-key');
      expect(result).toBeNull();
    });

    it('should return TTL value', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.ttl.mockResolvedValue(3600);

      const result = await redisTTL('test-key');
      expect(result).toBe(3600);
    });

    it('should return -1 for no expiry', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.ttl.mockResolvedValue(-1);

      const result = await redisTTL('test-key');
      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.ttl.mockResolvedValue(-2);

      const result = await redisTTL('test-key');
      expect(result).toBe(-2);
    });
  });

  describe('redisPing', () => {
    it('should return false when not configured', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      const result = await redisPing();
      expect(result).toBe(false);
    });

    it('should return true on PONG response', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.ping.mockResolvedValue('PONG');

      const result = await redisPing();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';
      mockRedisInstance.ping.mockRejectedValue(new Error('Error'));

      const result = await redisPing();
      expect(result).toBe(false);
    });
  });

  describe('resetRedisClient', () => {
    it('should reset client instance', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token123';

      // Create client
      const client1 = getRedisClient();
      expect(client1).not.toBeNull();

      // Reset
      resetRedisClient();

      // Should create new client
      const client2 = getRedisClient();
      expect(client2).not.toBeNull();
      expect(client1).not.toBe(client2);
    });
  });
});
