import { authOptions } from "@/lib/auth";
import { db } from "@/lib";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { hash } from "bcryptjs";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "127.0.0.1";
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting check for link creation
    const clientIp = getClientIp(req);
    const result = await rateLimit(`links:create:${clientIp}`, rateLimitConfigs.links);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please slow down.",
          retryAfter: result.reset,
        },
        {
          status: 429,
          headers: {
            "Retry-After": result.reset.toString(),
            "X-RateLimit-Limit": rateLimitConfigs.links.maxRequests.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.reset.toString(),
          },
        }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { url, customKey, password } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    let urlPattern;
    try {
      urlPattern = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const key = customKey || nanoid(8);

    const existingLink = await db.link.findFirst({
      where: {
        domain: "linkio.app",
        key: key,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "This custom key is already taken" },
        { status: 400 }
      );
    }

    const hashedPassword = password ? await hash(password, 12) : null;

    const link = await db.link.create({
      data: {
        domain: "linkio.app",
        key,
        url,
        password: hashedPassword,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        link: {
          id: link.id,
          key: link.key,
          url: link.url,
          clicks: link.clicks,
          createdAt: link.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Link creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const links = await db.link.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        key: true,
        url: true,
        clicks: true,
        createdAt: true,
        password: true,
      },
    });

    return NextResponse.json({
      links: links.map(link => ({
        ...link,
        password: link.password ? "protected" : null,
      })),
    });
  } catch (error) {
    console.error("Links fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
