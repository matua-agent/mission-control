"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatTimeAgo(timestamp: number | null) {
  if (!timestamp) return "Never";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
    />
  );
}

export default function Home() {
  const stats = useQuery(api.stats.overview);
  const isLoading = stats === undefined;

  const cards = [
    {
      label: "Actions (24h)",
      value: isLoading ? "—" : String(stats.activitiesLast24h),
      sub: isLoading ? "" : `${stats.totalActivities} total`,
    },
    {
      label: "Cron Jobs",
      value: isLoading ? "—" : String(stats.cronJobsActive),
      sub: isLoading ? "" : `${stats.cronJobsTotal} configured`,
    },
    {
      label: "Success Rate",
      value: isLoading ? "—" : `${stats.successRate}%`,
      sub: isLoading ? "" : "Last 24h",
    },
    {
      label: "Last Activity",
      value: isLoading ? "—" : formatTimeAgo(stats.lastActivity),
      sub: isLoading ? "" : `${stats.indexedDocs} docs indexed`,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Mission Overview</CardTitle>
            <StatusDot ok={!isLoading && stats.successRate >= 90} />
            <Badge className={`text-xs ${!isLoading && stats.successRate >= 90 ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
              {isLoading ? "Loading..." : stats.successRate >= 90 ? "Nominal" : "Degraded"}
            </Badge>
          </div>
          <CardDescription>
            Real-time telemetry from Matua&apos;s operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {cards.map((item) => (
            <div
              key={item.label}
              className="flex min-w-[180px] flex-1 flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {item.label}
              </p>
              <p className="text-2xl font-semibold text-slate-100">{item.value}</p>
              {item.sub && (
                <p className="text-xs text-slate-500">{item.sub}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Type breakdown */}
      {!isLoading && stats.activitiesLast24h > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Breakdown (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.typeBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2"
                  >
                    <span className="text-sm text-slate-400">{type}</span>
                    <Badge className="bg-slate-800 text-slate-200">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ActivityFeed />
    </div>
  );
}
