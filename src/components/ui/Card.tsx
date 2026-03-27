import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className, onClick }: Props) {
  return (
    <div className={`${className || "bg-white rounded-lg shadow-sm border border-gray-200 p-4 "}`} onClick={onClick}>
      {children}
    </div>
  );
}