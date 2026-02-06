import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}
