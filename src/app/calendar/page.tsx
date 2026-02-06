"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchScheduledTasks, ScheduledTask } from "@/lib/openclaw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday (0) to 7 for Monday-first calendar
  return day === 0 ? 6 : day - 1;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
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

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [daysInMonth, firstDay]);

  const tasksByDay = useMemo(() => {
    const map: Record<number, ScheduledTask[]> = {};
    
    for (const task of tasks) {
      const taskDate = new Date(task.scheduledAt);
      if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
        const day = taskDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(task);
      }
    }
    
    return map;
  }, [tasks, year, month]);

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
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
            Scheduled tasks from OpenClaw cron orchestration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-slate-100">
              {MONTH_NAMES[month]} {year}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
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
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-slate-900/80">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayTasks = day ? tasksByDay[day] || [] : [];
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] border-b border-r border-slate-800 p-2 ${
                        day === null ? "bg-slate-950/30" : "bg-slate-950/60"
                      } ${index % 7 === 0 ? "border-l-0" : ""}`}
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
                            {dayTasks.slice(0, 3).map((task) => (
                              <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="w-full text-left rounded-lg bg-slate-800/80 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700 transition truncate"
                              >
                                <span className="font-medium">{formatTime(new Date(task.scheduledAt))}</span>
                                {" "}
                                <span className="text-slate-400">{task.name}</span>
                              </button>
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="text-xs text-slate-500 px-2">
                                +{dayTasks.length - 3} more
                              </div>
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

      <Dialog open={Boolean(selectedTask)} onOpenChange={() => setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTask.name}</DialogTitle>
              <DialogDescription>
                Scheduled for {formatTime(new Date(selectedTask.scheduledAt))} on{" "}
                {new Date(selectedTask.scheduledAt).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
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
