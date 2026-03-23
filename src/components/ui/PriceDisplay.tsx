import React from "react";

interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  prefix?: string;
}

export function PriceDisplay({ amount, prefix = "$ ", className = "", ...props }: PriceDisplayProps) {
  const safeAmount = amount || 0;
  
  // Respetamos el mismo formato de número entero utilizado en PriceInput (es-AR)
  const formatted = Math.round(Math.abs(safeAmount)).toLocaleString("es-AR");
  
  // Respetar símbolo negativo para egresos o comisiones si es menor a 0
  const finalPrefix = safeAmount < 0 ? `-${prefix}` : prefix;

  return (
    <span className={className} {...props}>
      {finalPrefix}{formatted}
    </span>
  );
}
