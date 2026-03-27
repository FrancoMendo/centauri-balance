import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  variant?: "default" | "dark";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white border-surface-200 text-surface-800 placeholder:text-surface-400 focus:ring-primary-500/50 focus:border-primary-500",
      dark: "bg-neutral-900 border-white/5 text-white placeholder:text-neutral-600 focus:ring-accent-400/20 focus:border-accent-400/50 shadow-inner",
    };

    return (
      <div className="relative flex items-center w-full group">
        {icon && (
          <div className={cn(
            "absolute left-4 transition-colors",
            variant === "dark" 
              ? "text-neutral-500 group-focus-within:text-accent-400" 
              : "text-surface-400 group-focus-within:text-primary-500"
          )}>
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full border rounded-xl outline-none focus:ring-2 transition-all duration-200 font-medium disabled:opacity-50",
            variants[variant],
            icon ? "pl-12 pr-4 py-2.5" : "px-4 py-2.5",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);


Input.displayName = "Input";

