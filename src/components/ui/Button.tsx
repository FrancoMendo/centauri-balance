import React from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-800 hover:bg-primary-900 text-white shadow-sm focus:ring-primary-500 shadow-primary-900/20",
    secondary: "bg-surface-800 hover:bg-surface-900 text-white shadow-sm focus:ring-surface-500 shadow-surface-900/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 shadow-rose-500/20",
    outline: "border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300 hover:text-primary-800 focus:ring-surface-200 shadow-sm",
    ghost: "text-surface-500 hover:text-surface-800 hover:bg-surface-100 focus:ring-surface-200",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base md:text-lg",
  };

  return (
    <button className={twMerge(clsx(baseClasses, variants[variant], sizes[size]), className)} {...props}>
      {children}
    </button>
  );
}
