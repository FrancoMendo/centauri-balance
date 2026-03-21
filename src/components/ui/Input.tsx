import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-surface-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={twMerge(clsx(
            "w-full border border-surface-200 hover:border-primary-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors bg-white font-medium text-surface-800 placeholder:text-surface-400 disabled:opacity-50 disabled:bg-surface-50",
            icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5"
          ), className)}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
