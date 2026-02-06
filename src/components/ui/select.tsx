import { cn } from "@/lib/utils";

export function Select({
  className,
  value,
  onChange,
  children,
}: {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none",
        className
      )}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {children}
    </select>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return <option value={value}>{children}</option>;
}
