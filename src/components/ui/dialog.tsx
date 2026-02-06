"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={() => onOpenChange(false)}
        aria-label="Close dialog"
      />
      {children}
    </div>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative z-10 w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-2">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold text-slate-100">{children}</h3>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
