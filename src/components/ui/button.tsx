import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "solid",
  size = "md",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400",
        variant === "solid" && "bg-slate-100 text-slate-950 hover:bg-white",
        variant === "outline" &&
          "border border-slate-700 text-slate-100 hover:border-slate-400",
        variant === "ghost" && "text-slate-200 hover:bg-slate-800",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        className
      )}
      {...props}
    />
  );
}
