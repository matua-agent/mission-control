"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CronJob = {
  _id: string;
  jobId: string;
  name: string;
  enabled: boolean;
  schedule: string;
  timezone?: string;
  nextRunAt: number;
  lastRunAt?: number;
  description: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);

  const cronJobs = useQuery(api.cronJobs.list);
  const isLoading = cronJobs === undefined;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDay]);

  const jobsByDay = useMemo(() => {
    const map: Record<number, CronJob[]> = {};
    if (!cronJobs) return map;

    for (const job of cronJobs) {
      const jobDate = new Date(job.nextRunAt);
      if (jobDate.getFullYear() === year && jobDate.getMonth() === month) {
        const day = jobDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(job);
      }
    }
    return map;
  }, [cronJobs, year, month]);

  const goToPrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else { setMonth(month - 1); }
  };

  const goToNextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else { setMonth(month + 1); }
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  const isToday = (day: number) => {
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Schedule</CardTitle>
          <CardDescription>
            Scheduled tasks synced from OpenClaw cron.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-slate-100">
              {MONTH_NAMES[month]} {year}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>Previous</Button>
              <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>Next</Button>
            </div>
          </div>

          {isLoading && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Loading scheduled tasks...
            </div>
          )}

          {!isLoading && cronJobs?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              No cron jobs synced yet. Waiting for sync from VPS...
            </div>
          )}

          {!isLoading && cronJobs && cronJobs.length > 0 && (
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              <div className="grid grid-cols-7 bg-slate-900/80">
                {DAY_NAMES.map((day) => (
                  <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayJobs = day ? jobsByDay[day] || [] : [];
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] border-b border-r border-slate-800 p-2 ${
                        day === null ? "bg-slate-950/30" : "bg-slate-950/60"
                      }`}
                    >
                      {day !== null && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            isToday(day) 
                              ? "w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center" 
                              : "text-slate-300"
                          }`}>
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayJobs.slice(0, 3).map((job) => (
                              <button
                                key={job._id}
                                onClick={() => setSelectedJob(job)}
                                className="w-full text-left rounded-lg bg-slate-800/80 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition truncate"
                              >
                                <span className="font-medium">{formatTime(job.nextRunAt)}</span>
                                {" "}
                                <span className="text-slate-400">{job.name}</span>
                              </button>
                            ))}
                            {dayJobs.length > 3 && (
                              <div className="text-xs text-slate-500 px-2">+{dayJobs.length - 3} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedJob)} onOpenChange={() => setSelectedJob(null)}>
        {selectedJob && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedJob.name}</DialogTitle>
              <DialogDescription>
                Next run: {new Date(selectedJob.nextRunAt).toLocaleString()}
                {selectedJob.timezone && ` (${selectedJob.timezone})`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-300">
              <p>{selectedJob.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-800 text-slate-200">{selectedJob.schedule}</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-200">OpenClaw Cron</Badge>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
