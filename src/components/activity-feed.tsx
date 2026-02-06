"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const actionTypes = [
  "all",
  "tool call",
  "message",
  "file edit",
  "deployment",
  "system",
];

type Activity = {
  _id?: string;
  id?: string;
  timestamp: number;
  type: string;
  description: string;
  status: string;
};

const fallbackActivities: Activity[] = [
  {
    id: "demo-1",
    timestamp: Date.now() - 1000 * 60 * 2,
    type: "message",
    description: "Operator briefing acknowledged and queued.",
    status: "success",
  },
  {
    id: "demo-2",
    timestamp: Date.now() - 1000 * 60 * 15,
    type: "tool call",
    description: "Telemetry scan completed with 42 signals.",
    status: "success",
  },
  {
    id: "demo-3",
    timestamp: Date.now() - 1000 * 60 * 45,
    type: "file edit",
    description: "Updated mission itinerary and safety checks.",
    status: "failed",
  },
  {
    id: "demo-4",
    timestamp: Date.now() - 1000 * 60 * 120,
    type: "deployment",
    description: "Deployed finance-app to production.",
    status: "success",
  },
  {
    id: "demo-5",
    timestamp: Date.now() - 1000 * 60 * 180,
    type: "system",
    description: "Gateway restarted after config update.",
    status: "success",
  },
];

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "capitalize",
        status === "success"
          ? "bg-emerald-500/20 text-emerald-200"
          : "bg-rose-500/20 text-rose-200"
      )}
    >
      {status}
    </Badge>
  );
}

function TypeBadge({ type }: { type: string }) {
  return <Badge className="bg-slate-800 text-slate-200">{type}</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
      No activity yet. Actions will appear here as they happen.
    </div>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity._id || activity.id}
          className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {formatTime(activity.timestamp)}
            </p>
            <p className="text-base text-slate-100">{activity.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={activity.type} />
            <StatusBadge status={activity.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [activities, setActivities] = useState<Activity[]>(fallbackActivities);
  const [isConvexConnected, setIsConvexConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  useEffect(() => {
    if (!convexUrl) {
      setLoading(false);
      return;
    }

    // Try to fetch from Convex
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${convexUrl}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "activities:list",
            args: { type: typeFilter === "all" ? undefined : typeFilter },
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.value)) {
            setActivities(data.value);
            setIsConvexConnected(true);
          }
        }
      } catch {
        // Fall back to demo data
        setIsConvexConnected(false);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [convexUrl, typeFilter]);

  const filtered = activities.filter(
    (activity) => typeFilter === "all" || activity.type === typeFilter
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>
          Chronological log of actions and task completions.
          {!isConvexConnected && convexUrl && (
            <span className="ml-2 text-amber-400">(Demo mode — Convex schema pending)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {loading ? "Loading..." : `Showing ${filtered.length} activities • newest first`}
          </div>
          <div className="w-full sm:w-56">
            <Select value={typeFilter} onChange={setTypeFilter}>
              {actionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All types" : type}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
        {!loading && filtered.length === 0 ? <EmptyState /> : <ActivityList activities={filtered} />}
      </CardContent>
    </Card>
  );
}
