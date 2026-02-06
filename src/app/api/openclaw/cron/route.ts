import { NextResponse } from "next/server";

const tasks = [
  {
    id: "cron-1",
    name: "Telemetry Sweep",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    recurrence: "Every 2 hours",
    description: "Pulls diagnostic signals from all satellites.",
  },
  {
    id: "cron-2",
    name: "Memory Snapshot",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    recurrence: "Daily at 02:00",
    description: "Archives system memory and indexes new files.",
  },
  {
    id: "cron-3",
    name: "Risk Audit",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    recurrence: "Every Monday",
    description: "Runs compliance checks and alerts escalations.",
  },
];

export async function GET() {
  return NextResponse.json(tasks);
}
