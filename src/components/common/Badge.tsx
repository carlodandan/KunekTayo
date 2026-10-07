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
    neutral: "bg-[#1e1f22] text-[#dbdee1] border-[#35373c]",
    success: "bg-[#23a55a]/15 text-[#23a55a] border-[#23a55a]/30",
    warning: "bg-[#f0b232]/15 text-[#f0b232] border-[#f0b232]/30",
    danger: "bg-[#da373c]/15 text-[#da373c] border-[#da373c]/30",
    info: "bg-[#5865f2]/15 text-[#5865f2] border-[#5865f2]/30",
  };

  const dotColors = {
    neutral: "bg-[#80848e]",
    success: "bg-[#23a55a]",
    warning: "bg-[#f0b232]",
    danger: "bg-[#da373c]",
    info: "bg-[#5865f2]",
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
