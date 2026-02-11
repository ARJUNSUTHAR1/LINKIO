import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const links = await db.link.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        analytics: true,
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let clicksToday = 0;
    let clicksThisWeek = 0;
    let clicksThisMonth = 0;
    // Calculate unique visitors based on country+device+browser combination as a proxy
    // Since we don't store IP addresses, we use this as an approximation
    const uniqueVisitors = new Set<string>();

    links.forEach((link) => {
      link.analytics.forEach((analytic) => {
        const clickDate = new Date(analytic.timestamp);
        
        if (clickDate >= todayStart) {
          clicksToday++;
        }
        if (clickDate >= weekStart) {
          clicksThisWeek++;
        }
        if (clickDate >= monthStart) {
          clicksThisMonth++;
        }

        // Use combination of country, device, and browser as a unique visitor identifier
        const visitorKey = `${analytic.country || 'unknown'}-${analytic.device || 'unknown'}-${analytic.browser || 'unknown'}`;
        uniqueVisitors.add(visitorKey);
      });
    });

    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      let monthClicks = 0;
      links.forEach((link) => {
        link.analytics.forEach((analytic) => {
          const clickDate = new Date(analytic.timestamp);
          if (clickDate >= monthStart && clickDate <= monthEnd) {
            monthClicks++;
          }
        });
      });

      chartData.push({
        month: monthNames[date.getMonth()],
        clicks: monthClicks,
      });
    }

    const stats = {
      totalLinks: links.length,
      totalClicks,
      activeUsers: uniqueVisitors.size,
      clicksToday,
      clicksThisWeek,
      clicksThisMonth,
    };

    return NextResponse.json({
      stats,
      chartData,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
