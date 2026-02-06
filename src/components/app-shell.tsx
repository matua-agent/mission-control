"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/", label: "Activity" },
  { href: "/calendar", label: "Calendar" },
  { href: "/search", label: "Search" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
              Mission Control
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Command Deck</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-slate-800 text-slate-200">Dark Mode</Badge>
            <Badge className="bg-emerald-500/20 text-emerald-200">Live</Badge>
          </div>
        </header>
        <nav className="mt-4 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "border-slate-400 bg-slate-100 text-slate-900"
                    : "border-slate-800 text-slate-200 hover:border-slate-500 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="mt-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
