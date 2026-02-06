"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, formatDate, formatTime, startOfWeek } from "@/lib/date";
import { fetchScheduledTasks, ScheduledTask } from "@/lib/openclaw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchScheduledTasks()
      .then((data) => {
        if (active) {
          setTasks(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset)),
    [weekOffset]
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const tasksByDay = useMemo(() => {
    return weekDays.reduce<Record<string, ScheduledTask[]>>((acc, day) => {
      const key = day.toDateString();
      acc[key] = tasks.filter((task) => {
        const taskDate = new Date(task.scheduledAt);
        return taskDate.toDateString() === day.toDateString();
      });
      return acc;
    }, {});
  }, [tasks, weekDays]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Upcoming jobs pulled from OpenClaw cron orchestration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Week of {formatDate(weekStart)}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                Current
              </Button>
              <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
                Next
              </Button>
            </div>
          </div>
          {loading && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Loading scheduled tasks...
            </div>
          )}
          {error && (
            <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
              {error}
            </div>
          )}
          {!loading && !error && (
            <div className="grid gap-4 lg:grid-cols-7">
              {weekDays.map((day) => {
                const dayTasks = tasksByDay[day.toDateString()] ?? [];
                return (
                  <div
                    key={day.toISOString()}
                    className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {day.toLocaleDateString(undefined, { weekday: "short" })}
                      </p>
                      <p className="text-sm text-slate-200">
                        {day.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {dayTasks.length === 0 && (
                        <p className="text-xs text-slate-500">No tasks</p>
                      )}
                      {dayTasks.map((task) => {
                        const time = formatTime(new Date(task.scheduledAt));
                        return (
                          <button
                            key={task.id}
                            className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-left text-xs text-slate-200 transition hover:border-slate-500"
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{task.name}</span>
                              <Badge className="bg-slate-800 text-slate-200">
                                {time}
                              </Badge>
                            </div>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                              {task.recurrence}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTask)} onOpenChange={() => setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTask.name}</DialogTitle>
              <DialogDescription>
                Scheduled for {formatTime(new Date(selectedTask.scheduledAt))} on {" "}
                {formatDate(new Date(selectedTask.scheduledAt))}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-300">
              <p>{selectedTask.description ?? "No description provided."}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-800 text-slate-200">
                  {selectedTask.recurrence}
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-200">
                  OpenClaw Cron
                </Badge>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
