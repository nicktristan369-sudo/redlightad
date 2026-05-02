import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis is configured
const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client only if configured - with error handling
let redis: Redis | null = null;
if (hasRedis) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } catch (err) {
    console.error("[RateLimit] Failed to initialize Redis:", err);
  }
}

// No-op fallback for when Redis is not available
const noOpLimiter = {
  limit: async (_: string) => ({ success: true, remaining: 999, reset: 0 }),
};

// Create a rate limiter with graceful fallback
function createLimiter(
  options: { limiter: ReturnType<typeof Ratelimit.slidingWindow>; prefix: string }
) {
  if (!redis) {
    return noOpLimiter;
  }
  
  try {
    const limiter = new Ratelimit({
      redis,
      limiter: options.limiter,
      analytics: true,
      prefix: options.prefix,
    });

    // Wrap limit() to catch Redis errors and fallback gracefully
    return {
      limit: async (identifier: string) => {
        try {
          return await limiter.limit(identifier);
        } catch (err) {
          console.error("[RateLimit] Redis error, allowing request:", err);
          return { success: true, remaining: 999, reset: 0 };
        }
      },
    };
  } catch (err) {
    console.error("[RateLimit] Failed to create limiter:", err);
    return noOpLimiter;
  }
}

// ── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * General API rate limit: 100 requests per minute per IP
 */
export const apiRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:api",
});

/**
 * Auth rate limit: 5 login attempts per minute per IP (brute force protection)
 */
export const authRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:auth",
});

/**
 * Registration rate limit: 3 signups per hour per IP (anti-spam)
 */
export const signupRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:signup",
});

/**
 * Message rate limit: 30 messages per minute per user
 */
export const messageRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:msg",
});

/**
 * Upload rate limit: 10 uploads per minute per user
 */
export const uploadRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:upload",
});

/**
 * Search/scraping protection: 30 searches per minute per IP
 */
export const searchRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:search",
});

/**
 * Strict rate limit for sensitive operations: 3 per hour
 */
export const sensitiveRateLimit = createLimiter({
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:sensitive",
});

// ── Helper function ──────────────────────────────────────────────────────────

type RateLimiter = ReturnType<typeof createLimiter>;

export async function checkRateLimit(
  limiter: RateLimiter,
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
