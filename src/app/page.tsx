import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission Overview</CardTitle>
          <CardDescription>
            Real-time telemetry and operational posture for your agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {[
            { label: "Active Channels", value: "14" },
            { label: "Queued Jobs", value: "6" },
            { label: "System Health", value: "Nominal" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex min-w-[180px] flex-1 flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {item.label}
              </p>
              <p className="text-2xl font-semibold text-slate-100">{item.value}</p>
              <Badge className="w-fit bg-slate-800 text-slate-200">
                Updated now
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <ActivityFeed />
    </div>
  );
}
