"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AppStatus {
  name: string;
  url: string;
  status: "ok" | "error" | "loading";
  statusCode: number | null;
  responseTime: number;
  error?: string;
  checkedAt: number;
}

function getStatusColor(app: AppStatus) {
  if (app.status === "loading") return "bg-slate-600";
  if (app.status === "error") return "bg-red-500";
  if (app.responseTime < 500) return "bg-emerald-400";
  if (app.responseTime < 2000) return "bg-amber-400";
  return "bg-red-500";
}

function getStatusLabel(app: AppStatus) {
  if (app.status === "loading") return "Checking…";
  if (app.status === "error") return app.error ?? "Error";
  if (app.responseTime < 500) return `${app.responseTime}ms`;
  if (app.responseTime < 2000) return `${app.responseTime}ms`;
  return `${app.responseTime}ms`;
}

function getCardBorder(app: AppStatus) {
  if (app.status === "loading") return "border-slate-800";
  if (app.status === "error") return "border-red-900/50";
  if (app.responseTime < 500) return "border-emerald-900/50";
  if (app.responseTime < 2000) return "border-amber-900/50";
  return "border-red-900/50";
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function HealthPage() {
  const [results, setResults] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(60);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data: AppStatus[] = await res.json();
      setResults(data);
      setLastChecked(Date.now());
      setCountdown(60);
    } catch {
      // silently fail — show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const online = results.filter(
    (r) => r.status === "ok" && r.responseTime < 8000
  ).length;
  const total = results.length;
  const avgMs =
    results.length > 0
      ? Math.round(
          results.filter((r) => r.status === "ok").reduce((s, r) => s + r.responseTime, 0) /
            Math.max(1, results.filter((r) => r.status === "ok").length)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>App Health Monitor</CardTitle>
              <CardDescription>
                Live status for all deployed apps — auto-refreshes every 60s
              </CardDescription>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition disabled:opacity-50"
            >
              {loading ? "Checking…" : "↺ Refresh"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-slate-500 uppercase tracking-widest text-xs">Online</span>
              <p className="text-xl font-semibold text-slate-100 mt-1">
                <span className={online === total ? "text-emerald-400" : "text-amber-400"}>
                  {loading ? "—" : online}
                </span>
                <span className="text-slate-500">/{total}</span>
              </p>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-widest text-xs">Avg Response</span>
              <p className="text-xl font-semibold text-slate-100 mt-1">
                {loading ? "—" : `${avgMs}ms`}
              </p>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-widest text-xs">Last Checked</span>
              <p className="text-xl font-semibold text-slate-100 mt-1">
                {lastChecked ? formatTime(lastChecked) : "—"}
              </p>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-widest text-xs">Next Refresh</span>
              <p className="text-xl font-semibold text-slate-100 mt-1">
                {loading ? "…" : `${countdown}s`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.length === 0 && loading
          ? Array.from({ length: 33 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4 animate-pulse h-24"
              />
            ))
          : results.map((app) => (
              <div
                key={app.url}
                className={`rounded-3xl border bg-slate-950/60 p-4 flex items-start justify-between gap-3 transition hover:bg-slate-900/80 ${getCardBorder(app)}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`mt-1 flex-shrink-0 h-2.5 w-2.5 rounded-full ${getStatusColor(app)} ${
                      app.status === "ok" && app.responseTime < 2000 ? "animate-pulse" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 truncate">{app.name}</p>
                    <p
                      className={`text-xs mt-0.5 ${
                        app.status === "error"
                          ? "text-red-400"
                          : app.responseTime < 500
                          ? "text-emerald-400"
                          : app.responseTime < 2000
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {getStatusLabel(app)}
                    </p>
                  </div>
                </div>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition mt-0.5"
                  title={`Open ${app.name}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-4.5L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              </div>
            ))}
      </div>
    </div>
  );
}
