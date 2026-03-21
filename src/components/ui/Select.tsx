import React from "react";
import clsx from "clsx";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-surface-400">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={clsx(
            "w-full border border-surface-200 hover:border-primary-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors bg-white font-medium text-surface-800 disabled:opacity-50 disabled:bg-surface-50",
            icon ? "pl-10 pr-3 py-2.5" : "px-3 py-2.5",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
