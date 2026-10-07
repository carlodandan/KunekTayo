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
      "inline-flex items-center justify-center font-medium rounded-xl cursor-pointer transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1f22] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

    const variantStyles = {
      primary:
        "bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white shadow-none",
      secondary:
        "bg-[#4e5058] hover:bg-[#3f4147] active:bg-[#35373c] text-[#f2f3f5] border border-[#4e5058] shadow-none",
      outline:
        "border border-[#3f4147] hover:border-[#4e5058] bg-transparent text-[#dbdee1] hover:bg-[#35373c] active:bg-[#2b2d31]",
      ghost:
        "bg-transparent hover:bg-[#35373c] text-[#949ba4] hover:text-[#f2f3f5] active:bg-[#2b2d31]",
      danger:
        "bg-[#da373c] hover:bg-[#c23136] active:bg-[#a1282c] text-white shadow-none",
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
