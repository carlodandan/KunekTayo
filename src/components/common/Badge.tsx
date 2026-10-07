import React from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "info";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  dot = false,
  className,
  ...props
}) => {
  const variantStyles = {
    neutral: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    danger: "bg-red-950/60 text-red-400 border-red-800/60",
    info: "bg-blue-950/60 text-blue-400 border-blue-800/60",
  };

  const dotColors = {
    neutral: "bg-slate-400",
    success: "bg-emerald-400 animate-pulse",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    info: "bg-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none whitespace-nowrap",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};
