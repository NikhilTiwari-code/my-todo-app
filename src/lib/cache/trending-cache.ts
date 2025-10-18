/**
 * ⚡ Trending Data Cache Layer
 * 
 * Uses Redis for caching trending data to reduce database load
 * Cache TTL: 5 minutes for trending data
 */

import { getRedisClient } from '@/lib/redis';

const CACHE_PREFIX = 'trending:';
const CACHE_TTL = 300; // 5 minutes

/**
 * Get trending data from cache
 * 
 * @param key - Cache key (e.g., 'all', 'news', 'tech')
 */
export async function getCachedTrending(key: string): Promise<any | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null; // Redis not available
    
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Cache HIT for ${key}`);
      return JSON.parse(cached);
    }
    
    console.log(`❌ Cache MISS for ${key}`);
    return null;
  } catch (error: any) {
    console.error('Redis get error:', error.message);
    return null;
  }
}

/**
 * Set trending data in cache
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in seconds (default: 5 minutes)
 */
export async function setCachedTrending(
  key: string,
  data: any,
  ttl: number = CACHE_TTL
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) return false;
    
    const cacheKey = `${CACHE_PREFIX}${key}`;
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    console.log(`✅ Cached ${key} for ${ttl}s`);
    return true;
  } catch (error: any) {
    console.error('Redis set error:', error.message);
    return false;
  }
}

/**
 * Invalidate trending cache
 * 
 * @param key - Cache key to invalidate (or 'all' for all keys)
 */
export async function invalidateTrendingCache(key: string = 'all'): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    
    if (key === 'all') {
      // Delete all trending cache keys
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✅ Invalidated ${keys.length} cache keys`);
      }
    } else {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      await redis.del(cacheKey);
      console.log(`✅ Invalidated cache for ${key}`);
    }
  } catch (error: any) {
    console.error('Redis delete error:', error.message);
  }
}

/**
 * Get cached search results
 * 
 * @param query - Search query
 */
export async function getCachedSearch(query: string): Promise<any | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Search cache HIT for "${query}"`);
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error: any) {
    console.error('Redis search get error:', error.message);
    return null;
  }
}

/**
 * Cache search results
 * 
 * @param query - Search query
 * @param results - Search results
 */
export async function setCachedSearch(query: string, results: any): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    
    const cacheKey = `search:${query.toLowerCase()}`;
    // Cache search results for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(results));
    console.log(`✅ Cached search results for "${query}"`);
  } catch (error: any) {
    console.error('Redis search set error:', error.message);
  }
}

/**
 * Cache trending stats
 */
export async function getCachedStats(): Promise<any | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    
    const cached = await redis.get('trending:stats');
    return cached ? JSON.parse(cached) : null;
  } catch (error: any) {
    console.error('Redis stats get error:', error.message);
    return null;
  }
}

export async function setCachedStats(stats: any): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    
    await redis.setex('trending:stats', 600, JSON.stringify(stats)); // 10 minutes
    console.log('✅ Cached trending stats');
  } catch (error: any) {
    console.error('Redis stats set error:', error.message);
  }
}

/**
 * Get cache info (for debugging)
 */
export async function getCacheInfo() {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    const info: any = {
      totalKeys: keys.length,
      keys: [],
    };

    for (const key of keys.slice(0, 10)) {
      const ttl = await redis.ttl(key);
      info.keys.push({ key, ttl });
    }

    return info;
  } catch (error: any) {
    console.error('Redis info error:', error.message);
    return null;
  }
}
