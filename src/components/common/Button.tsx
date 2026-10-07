import React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl cursor-pointer transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

    const variantStyles = {
      primary:
        "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:bg-blue-700",
      secondary:
        "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:bg-slate-800",
      outline:
        "border border-slate-700 hover:border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800/60 active:bg-slate-800",
      ghost:
        "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white active:bg-slate-800/80",
      danger:
        "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 active:bg-red-700",
    };

    // Meeting touch target guidance: >=44px desktop / 48px mobile
    const sizeStyles = {
      sm: "h-10 px-3.5 text-sm gap-2 min-h-[40px]",
      md: "h-12 px-5 text-base gap-2.5 min-h-[48px]",
      lg: "h-14 px-7 text-lg gap-3 min-h-[56px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="inline-flex shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="inline-flex shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
