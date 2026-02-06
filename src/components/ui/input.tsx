import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
