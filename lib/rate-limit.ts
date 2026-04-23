import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (uses UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * General API rate limit: 100 requests per minute per IP
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "rl:api",
});

/**
 * Auth rate limit: 5 login attempts per minute per IP (brute force protection)
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "rl:auth",
});

/**
 * Registration rate limit: 3 signups per hour per IP (anti-spam)
 */
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "rl:signup",
});

/**
 * Message rate limit: 30 messages per minute per user
 */
export const messageRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:msg",
});

/**
 * Upload rate limit: 10 uploads per minute per user
 */
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "rl:upload",
});

/**
 * Search/scraping protection: 30 searches per minute per IP
 */
export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "rl:search",
});

/**
 * Strict rate limit for sensitive operations: 3 per hour
 */
export const sensitiveRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
  prefix: "rl:sensitive",
});

// ── Helper function ──────────────────────────────────────────────────────────

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

// ── Get client IP helper ─────────────────────────────────────────────────────

export function getClientIP(request: Request): string {
  // Check various headers for real IP (behind proxy/CDN)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  const cfIP = request.headers.get("cf-connecting-ip"); // Cloudflare
  if (cfIP) {
    return cfIP;
  }
  
  // Fallback
  return "unknown";
}
