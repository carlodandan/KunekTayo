import React from "react";
import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium uppercase tracking-wider text-[#dbdee1] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#949ba4] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-12 bg-[#1e1f22] text-[#f2f3f5] placeholder:text-[#80848e] rounded-xl px-4 border border-[#35373c] outline-none transition-colors duration-150 focus:border-[#283E7C] focus:ring-1 focus:ring-[#283E7C] text-sm md:text-base",
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              error && "border-[#da373c] focus:border-[#da373c] focus:ring-[#da373c]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#949ba4] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#da373c] font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#949ba4]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
