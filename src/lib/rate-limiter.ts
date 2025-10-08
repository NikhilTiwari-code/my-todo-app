/**
 * Rate Limiter Implementation
 * 
 * Strategy: Token Bucket Algorithm with in-memory store
 * 
 * Future improvements:
 * - Use Redis for distributed rate limiting (multi-server)
 * - Implement sliding window for more accurate limits
 * - Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for multi-server setup)
const store = new Map<string, RateLimitStore>();

/**
 * Token Bucket Algorithm
 * - Each IP/user gets a bucket with tokens
 * - Each request consumes a token
 * - Tokens refill after time window expires
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: "Too many requests, please try again later.",
      ...config,
    };
  }

  /**
   * Check if request should be rate limited
   * @param identifier - IP address or user ID
   * @returns { success: boolean, remaining: number, resetTime: number }
   */
  check(identifier: string): {
    success: boolean;
    remaining: number;
    resetTime: number;
    message?: string;
  } {
    const now = Date.now();
    const key = this.getKey(identifier);
    const record = store.get(key);

    // First request or window expired
    if (!record || now > record.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Within rate limit
    if (record.count < this.config.maxRequests) {
      record.count++;
      store.set(key, record);

      return {
        success: true,
        remaining: this.config.maxRequests - record.count,
        resetTime: record.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      message: this.config.message,
    };
  }

  private getKey(identifier: string): string {
    return `ratelimit:${identifier}`;
  }

  /**
   * Reset rate limit for an identifier
   * Useful for testing or administrative actions
   */
  reset(identifier: string): void {
    const key = this.getKey(identifier);
    store.delete(key);
  }

  /**
   * Clean up expired entries (memory optimization)
   * Call this periodically in production
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }
}

/**
 * Predefined rate limiters for different endpoint types
 */

// Development vs Production rate limits
const isDev = process.env.NODE_ENV !== "production";

// AUTH ENDPOINTS (Login/Register) - STRICTEST
// Why: Prevent brute force attacks, credential stuffing
// Dev: 50 attempts per 15 minutes | Production: 5 attempts per 15 minutes
export const authRateLimiter = new RateLimiter({
  maxRequests: isDev ? 50 : 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

// STRICT AUTH (Failed login attempts) - VERY STRICT
// Dev: 20 failed attempts | Production: 3 failed attempts per 30 minutes
export const failedLoginLimiter = new RateLimiter({
  maxRequests: isDev ? 20 : 3,
  windowMs: 30 * 60 * 1000, // 30 minutes
  message: "Account temporarily locked due to multiple failed login attempts. Try again in 30 minutes.",
});

// DATA MUTATION (Create/Update/Delete) - MODERATE
// Why: Prevent spam, abuse, accidental infinite loops
// Dev: 500 requests | Production: 100 requests per 15 minutes
export const mutationRateLimiter = new RateLimiter({
  maxRequests: isDev ? 500 : 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many modifications. Please slow down and try again later.",
});

// READ OPERATIONS (Get todos, etc) - LENIENT
// Why: Allow normal usage, prevent DOS attacks
// Dev: 5000 requests | Production: 1000 requests per 15 minutes
export const readRateLimiter = new RateLimiter({
  maxRequests: isDev ? 5000 : 1000,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests. Please try again later.",
});

// GENERAL API - MODERATE
// Fallback for any endpoint without specific rate limit
// Dev: 1000 requests | Production: 200 requests per 15 minutes
export const generalRateLimiter = new RateLimiter({
  maxRequests: isDev ? 1000 : 200,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Rate limit exceeded. Please try again later.",
});

// Cleanup expired entries every 10 minutes
if (typeof window === "undefined") {
  // Only run on server
  setInterval(() => {
    RateLimiter.cleanup();
  }, 10 * 60 * 1000);
}
