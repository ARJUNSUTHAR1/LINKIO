import { NextResponse } from "next/server";
import { db } from "@/lib";
import redis from "@/lib/redis";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
      api: "healthy",
    },
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.services.database = "healthy";
  } catch (error) {
    checks.services.database = "unhealthy";
    checks.status = "degraded";
  }

  try {
    if (redis) {
      await redis.ping();
      checks.services.redis = "healthy";
    } else {
      checks.services.redis = "unavailable";
    }
  } catch (error) {
    checks.services.redis = "unhealthy";
    checks.status = "degraded";
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
