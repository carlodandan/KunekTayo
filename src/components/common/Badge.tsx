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
    neutral: "bg-[#1e1f22] text-[#9098C8] border-[#35373c]",
    success: "bg-[#1F332B] text-white border-[#1F332B]",
    warning: "bg-[#f0b232]/20 text-[#f0b232] border-[#f0b232]/40",
    danger: "bg-[#da373c]/20 text-[#da373c] border-[#da373c]/40",
    info: "bg-[#283E7C]/25 text-[#9098C8] border-[#283E7C]/40",
  };

  const dotColors = {
    neutral: "bg-[#9098C8]",
    success: "bg-[#1F332B]",
    warning: "bg-[#f0b232]",
    danger: "bg-[#da373c]",
    info: "bg-[#9098C8]",
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
