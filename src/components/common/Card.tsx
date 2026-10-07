import React from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  elevated = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 text-slate-100 transition-all duration-150",
        elevated && "shadow-xl shadow-black/40 border-slate-700/80 bg-slate-900/90",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
