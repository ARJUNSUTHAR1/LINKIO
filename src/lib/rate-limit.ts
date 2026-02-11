import redis, { redisConnected } from "./redis";

interface RateLimitConfig {
  interval: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  interval: 60,
  maxRequests: 10,
};

let rateLimitWarningShown = false;

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  // If Redis is not connected, bypass rate limiting
  if (!redisConnected || !redis) {
    if (!rateLimitWarningShown) {
      console.warn("⚠️  Rate limiting is disabled (Redis not configured)");
      rateLimitWarningShown = true;
    }
    return {
      success: true,
      remaining: config.maxRequests,
      reset: config.interval,
    };
  }

  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.interval * 1000;

  try {
    // Remove old entries outside the time window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const requests = await redis.zcard(key);

    if (requests >= config.maxRequests) {
      // Get the oldest request timestamp to calculate reset time
      const oldestRequests = await redis.zrange(key, 0, 0, { withScores: true }) as Array<{ score: number | string; value: string }>;
      const resetTime = oldestRequests.length > 0 && oldestRequests[0]
        ? (typeof oldestRequests[0].score === 'number' ? oldestRequests[0].score : parseInt(oldestRequests[0].score as string)) + config.interval * 1000
        : now + config.interval * 1000;

      return {
        success: false,
        remaining: 0,
        reset: Math.ceil((resetTime - now) / 1000),
      };
    }

    // Add current request timestamp
    await redis.zadd(key, { score: now, member: `${now}` });
    
    // Set expiry on the key
    await redis.expire(key, config.interval);

    return {
      success: true,
      remaining: config.maxRequests - requests - 1,
      reset: config.interval,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Silently fail - return success to allow request through
    return {
      success: true,
      remaining: config.maxRequests,
      reset: config.interval,
    };
  }
}

export const rateLimitConfigs = {
  api: { interval: 60, maxRequests: 60 },
  auth: { interval: 300, maxRequests: 5 },
  links: { interval: 60, maxRequests: 20 },
  analytics: { interval: 60, maxRequests: 30 },
};
