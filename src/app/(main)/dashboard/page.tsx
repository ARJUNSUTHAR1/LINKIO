"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Link as LinkIcon, MousePointerClick, Users, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeUsers: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
}

interface ChartData {
  month: string;
  clicks: number;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalClicks: 0,
    activeUsers: 0,
    clicksToday: 0,
    clicksThisWeek: 0,
    clicksThisMonth: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || stats);
        setChartData(data.chartData || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const targetUsers = 500;
  const userProgress = (stats.activeUsers / targetUsers) * 100;

  const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage all your links in single dashboard with custom analytics and insights
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all your links in single dashboard with custom analytics and insights
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalLinks}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Manage all your links in single dashboard with custom analytics and insights
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              This is how much the links have been clicked throughout the year
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.activeUsers}</div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your target</span>
                <span className="font-medium">{targetUsers}</span>
              </div>
              <Progress value={userProgress} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total benchmark of your target how much the users have been used your links
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
            <CardDescription>Total link clicks across all funnels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-muted opacity-20"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-primary"
                    strokeDasharray={`${(stats.totalClicks / (stats.totalClicks + 100)) * 502} 502`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-3xl font-bold">{stats.totalClicks}</div>
                  <div className="text-xs text-muted-foreground">Total clicks</div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Hover to get more details on project page
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Analytics</CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{new Date().toLocaleDateString()}</span>
              <span>Total</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-primary rounded-sm" />
                <span>Total clicks</span>
                <span className="ml-auto font-medium">{stats.totalClicks.toLocaleString()}</span>
              </div>
              
              <div className="h-48 flex items-end justify-between gap-2 border-l border-b border-border pl-2 pb-2">
                {chartData.map((data, index) => {
                  const height = (data.clicks / maxClicks) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t relative group cursor-pointer"
                        style={{ height: `${height}%`, minHeight: "8px" }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-lg">
                          {data.clicks} clicks
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{data.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicksToday}</div>
            <p className="text-xs text-muted-foreground">clicks today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicksThisWeek}</div>
            <p className="text-xs text-muted-foreground">clicks this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clicksThisMonth}</div>
            <p className="text-xs text-muted-foreground">clicks this month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
