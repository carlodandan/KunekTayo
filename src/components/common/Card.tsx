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
        "rounded-2xl border border-[#35373c] bg-[#2b2d31] p-6 text-[#dbdee1] transition-colors duration-150",
        elevated && "border-[#3f4147] bg-[#2b2d31]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
