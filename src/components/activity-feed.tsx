"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  _id: string;
  timestamp: number;
  type: string;
  description: string;
  status: string;
};

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

function EmptyState({ onSeed }: { onSeed?: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-center">
      <p className="text-sm text-slate-400 mb-4">No activity yet. Seed some demo data?</p>
      {onSeed && (
        <Button variant="outline" size="sm" onClick={onSeed}>
          Add sample activities
        </Button>
      )}
    </div>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity._id}
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
  
  const activities = useQuery(api.activities.list, {
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  
  const seedMutation = useMutation(api.activities.seed);

  const handleSeed = async () => {
    await seedMutation({});
  };

  const isLoading = activities === undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>
          Chronological log of actions and task completions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {isLoading ? "Loading..." : `Showing ${activities?.length || 0} activities • newest first`}
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
        {!isLoading && (!activities || activities.length === 0) ? (
          <EmptyState onSeed={handleSeed} />
        ) : (
          <ActivityList activities={activities || []} />
        )}
      </CardContent>
    </Card>
  );
}
