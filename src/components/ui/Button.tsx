import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "dark" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/40 focus:ring-primary-500",
    secondary: "bg-neutral-800 hover:bg-neutral-700 text-white shadow-lg shadow-black/20 focus:ring-neutral-500",
    accent: "bg-accent-400 hover:bg-accent-300 text-neutral-950 shadow-lg shadow-accent-400/20 focus:ring-accent-400",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 focus:ring-rose-500",
    outline: "border-2 border-primary-500/30 bg-transparent text-primary-400 hover:bg-primary-500/10 hover:border-primary-500 focus:ring-primary-500",
    ghost: "text-neutral-400 hover:text-white hover:bg-white/10 focus:ring-white/20",
    dark: "bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-black/40 focus:ring-primary-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base md:text-lg",
    xl: "px-10 py-4 text-xl font-black tracking-tight",
  };

  return (
    <button className={cn(baseClasses, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

