"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, MousePointerClick, Globe, LoaderIcon } from "lucide-react";

interface LinkAnalytics {
  linkKey: string;
  url: string;
  clicks: number;
  uniqueVisitors: number;
  topCountry: string;
  topDevice: string;
  lastClick: Date | null;
}

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<LinkAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalClicks: 0,
    totalLinks: 0,
    avgClicksPerLink: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
        setTotalStats(data.totalStats || totalStats);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track and analyze your link performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across all links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalLinks}</div>
            <p className="text-xs text-muted-foreground">shortened links</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgClicksPerLink.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">per link</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Link Performance</CardTitle>
          <CardDescription>Detailed analytics for each of your links</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderIcon className="w-8 h-8 animate-spin" />
            </div>
          ) : analytics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No analytics data available yet. Create and share links to see analytics!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Unique Visitors</TableHead>
                    <TableHead>Top Country</TableHead>
                    <TableHead>Top Device</TableHead>
                    <TableHead>Last Click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono font-medium text-primary">
                        /{item.linkKey}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {item.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.clicks}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          {item.uniqueVisitors}
                        </div>
                      </TableCell>
                      <TableCell>{item.topCountry || "N/A"}</TableCell>
                      <TableCell>{item.topDevice || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.lastClick
                          ? new Date(item.lastClick).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
