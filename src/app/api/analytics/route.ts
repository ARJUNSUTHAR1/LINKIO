import { authOptions } from "@/lib/auth";
import { db } from "@/lib";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "127.0.0.1";
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting check for analytics
    const clientIp = getClientIp(req);
    const result = await rateLimit(`analytics:${clientIp}`, rateLimitConfigs.analytics);
    
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
            "X-RateLimit-Limit": rateLimitConfigs.analytics.maxRequests.toString(),
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

    const links = await db.link.findMany({
      where: {
        userId: user.id,
      },
      include: {
        analytics: {
          orderBy: {
            timestamp: "desc",
          },
        },
      },
    });

    const totalClicks = links.reduce((acc, link) => acc + link.clicks, 0);
    const totalLinks = links.length;

    const deviceStats = links.flatMap(link => link.analytics).reduce((acc, analytic) => {
      const device = analytic.device || "Unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const browserStats = links.flatMap(link => link.analytics).reduce((acc, analytic) => {
      const browser = analytic.browser || "Unknown";
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const osStats = links.flatMap(link => link.analytics).reduce((acc, analytic) => {
      const os = analytic.os || "Unknown";
      acc[os] = (acc[os] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLinks = links
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(link => ({
        key: link.key,
        url: link.url,
        clicks: link.clicks,
      }));

    const clicksByDay = links.flatMap(link => 
      link.analytics.map(a => ({
        date: new Date(a.timestamp).toLocaleDateString(),
        clicks: 1,
      }))
    ).reduce((acc, item) => {
      acc[item.date] = (acc[item.date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const clicksOverTime = Object.entries(clicksByDay)
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const analytics = links.map(link => {
      const countries = link.analytics.map(a => a.country).filter(Boolean);
      const devices = link.analytics.map(a => a.device).filter(Boolean);
      
      const topCountry = countries.length > 0 
        ? countries.reduce((a, b) => 
            countries.filter(c => c === a).length >= countries.filter(c => c === b).length ? a : b
          )
        : null;
      
      const topDevice = devices.length > 0
        ? devices.reduce((a, b) =>
            devices.filter(d => d === a).length >= devices.filter(d => d === b).length ? a : b
          )
        : null;

      const lastClick = link.analytics.length > 0 
        ? link.analytics[0].timestamp 
        : null;

      // Calculate unique visitors based on unique country+device combinations as a proxy
      // Since we don't store IP addresses, we use this as an approximation
      const uniqueVisitors = new Set(
        link.analytics
          .map(a => `${a.country || 'unknown'}-${a.device || 'unknown'}`)
          .filter(Boolean)
      ).size;

      return {
        linkKey: link.key,
        url: link.url,
        clicks: link.clicks,
        uniqueVisitors,
        topCountry,
        topDevice,
        lastClick,
      };
    });

    const avgClicksPerLink = totalLinks > 0 ? totalClicks / totalLinks : 0;

    return NextResponse.json({
      totalClicks,
      totalLinks,
      deviceStats,
      browserStats,
      osStats,
      topLinks,
      clicksOverTime,
      analytics,
      totalStats: {
        totalClicks,
        totalLinks,
        avgClicksPerLink,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
