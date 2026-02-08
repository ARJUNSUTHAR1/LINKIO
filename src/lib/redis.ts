import { Redis } from "@upstash/redis";

// Check if Upstash credentials are available
const isUpstashConfigured = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
let redisConnected = false;

if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  redisConnected = true;
  console.log("✅ Upstash Redis configured - rate limiting enabled");
} else {
  console.warn("⚠️  Upstash Redis not configured. Rate limiting disabled.");
  console.warn("   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.");
}

export default redis;
export { redisConnected };

export const cacheGet = async (key: string) => {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
};

export const cacheSet = async (key: string, value: any, ttl: number = 3600) => {
  if (!redis) return false;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
};

export const cacheDel = async (key: string) => {
  if (!redis) return false;
  
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Cache delete error:", error);
    return false;
  }
};
