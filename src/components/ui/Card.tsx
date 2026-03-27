import React from "react";
import { cn } from "../../lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: Props) {
  return (
    <div 
      className={cn("bg-neutral-900 rounded-3xl border border-white/5 p-6 shadow-xl", className)} 
      onClick={onClick}
    >
      {children}
    </div>
  );
}