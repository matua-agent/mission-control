import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Read cron jobs from OpenClaw's cron directory
export async function GET() {
  try {
    const cronDir = path.join(process.env.HOME || "/home/ubuntu", ".openclaw/cron/jobs");
    
    if (!fs.existsSync(cronDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(cronDir).filter(f => f.endsWith(".json"));
    const tasks = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(cronDir, file), "utf-8");
        const job = JSON.parse(content);
        
        if (!job.enabled) continue;

        // Parse schedule
        let scheduledAt = new Date();
        let recurrence = "Unknown";
        
        if (job.schedule?.kind === "cron") {
          recurrence = `Cron: ${job.schedule.expr}`;
          if (job.schedule.tz) recurrence += ` (${job.schedule.tz})`;
        } else if (job.schedule?.kind === "every") {
          const mins = Math.round((job.schedule.everyMs || 0) / 60000);
          recurrence = `Every ${mins} minutes`;
        } else if (job.schedule?.kind === "at") {
          scheduledAt = new Date(job.schedule.at);
          recurrence = "One-time";
        }

        // Use nextRunAtMs if available
        if (job.state?.nextRunAtMs) {
          scheduledAt = new Date(job.state.nextRunAtMs);
        }

        tasks.push({
          id: job.id,
          name: job.name || "Unnamed Job",
          scheduledAt: scheduledAt.toISOString(),
          recurrence,
          description: job.payload?.message?.slice(0, 200) || job.payload?.text?.slice(0, 200) || "No description",
        });
      } catch {
        // Skip malformed files
      }
    }

    // Sort by next run time
    tasks.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error reading cron jobs:", error);
    return NextResponse.json([]);
  }
}
