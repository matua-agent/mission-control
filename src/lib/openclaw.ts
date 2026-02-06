export type ScheduledTask = {
  id: string;
  name: string;
  scheduledAt: string;
  recurrence: string;
  description?: string;
};

export async function fetchScheduledTasks(): Promise<ScheduledTask[]> {
  const endpoint =
    process.env.NEXT_PUBLIC_OPENCLAW_CRON_URL || "/api/openclaw/cron";

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load scheduled tasks");
  }

  return response.json();
}
