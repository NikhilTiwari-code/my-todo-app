/**
 * Rate Limit Middleware for Next.js API Routes
 * 
 * Usage:
 * import { withRateLimit } from "@/middleware/rate-limit";
 * 
 * export const POST = withRateLimit(handler, { limiter: authRateLimiter });
 */

import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limiter";

interface RateLimitOptions {
  limiter: RateLimiter;
  identifier?: (request: Request) => string | Promise<string>;
  onRateLimitExceeded?: (identifier: string, resetTime: number) => void;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check headers in order of reliability
  const headers = request.headers;
  
  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  // General proxy headers
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }
  
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  
  // Fallback (won't work behind proxy, but better than nothing)
  return "unknown";
}

/**
 * Get user ID from JWT token in cookie
 * Falls back to IP if not authenticated
 */
export async function getIdentifier(request: Request): Promise<string> {
  try {
    const token = request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    
    if (token) {
      // Decode JWT (without verification since we just need ID)
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      
      if (payload.id) {
        return `user:${payload.id}`;
      }
    }
  } catch (error) {
    // Token invalid or not present, fall back to IP
  }
  
  return `ip:${getClientIp(request)}`;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * Supports both simple handlers and handlers with context (like [id] routes)
 * 
 * @example
 * // Simple route
 * export const POST = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ success: true });
 *   },
 *   { limiter: authRateLimiter }
 * );
 * 
 * // Route with params
 * export const GET = withRateLimit(
 *   async (request, context) => {
 *     const { id } = context.params;
 *     return NextResponse.json({ id });
 *   },
 *   { limiter: readRateLimiter }
 * );
 */
export function withRateLimit<T extends any[] = []>(
  handler: (request: Request, ...args: T) => Promise<NextResponse>,
  options: RateLimitOptions
) {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    const { limiter, identifier: getCustomIdentifier, onRateLimitExceeded } = options;

    // Get identifier (IP or user ID)
    const identifier = getCustomIdentifier
      ? await getCustomIdentifier(request)
      : await getIdentifier(request);

    // Check rate limit
    const result = limiter.check(identifier);

    // Add rate limit headers to response
    const headers = {
      "X-RateLimit-Limit": limiter["config"].maxRequests.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    };

    // Rate limit exceeded
    if (!result.success) {
      if (onRateLimitExceeded) {
        onRateLimitExceeded(identifier, result.resetTime);
      }

      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: result.message,
          retryAfter: retryAfter,
          resetTime: new Date(result.resetTime).toISOString(),
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // Rate limit OK, proceed with handler
    const response = await handler(request, ...args);

    // Add rate limit headers to successful response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Specifically for tracking failed login attempts
 * Use this in addition to general auth rate limiting
 */
export function trackFailedLogin(identifier: string): boolean {
  // This would typically update a separate store
  // For now, using the same mechanism
  return true;
}
