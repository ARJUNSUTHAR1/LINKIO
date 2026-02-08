import { db } from "@/lib";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "127.0.0.1";
};

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const clientIp = getClientIp(req);
    const result = await rateLimit(`auth:register:${clientIp}`, rateLimitConfigs.auth);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
          retryAfter: result.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": result.reset.toString(),
            "X-RateLimit-Limit": rateLimitConfigs.auth.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
          },
        }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
