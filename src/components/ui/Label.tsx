import React from "react";
import clsx from "clsx";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={clsx("block text-sm font-medium text-surface-700 mb-1.5", className)} {...props}>
      {children}
    </label>
  );
}
