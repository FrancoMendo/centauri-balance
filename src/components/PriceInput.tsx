import React, { useState, useEffect } from "react";

interface PriceInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
}

export function PriceInput({ value, onChange, className, ...props }: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Sincronizar el valor desde afuera hacia adentro (por ej: vaciar el form al cerrar el modal)
  useEffect(() => {
    if (value === 0 && !displayValue) {
      // Dejar el input en blanco visualmente si es 0 en el inicio (mejor UX)
      setDisplayValue("");
    } else if (value !== 0 || displayValue) {
      setDisplayValue(formatNumber(value.toString()));
    }
  }, [value]);

  const formatNumber = (val: string) => {
    // 1. Quitar todo lo que no sean números
    const numericValue = val.replace(/\D/g, "");
    if (!numericValue) return "";
    
    // 2. Usar formato internacional agregando siempre el símbolo $ fijo a la izquierda
    return "$ " + parseInt(numericValue, 10).toLocaleString("es-AR");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Tomar el valor puro (sin puntos) escrito por el usuario
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = parseInt(rawValue, 10);
    
    if (isNaN(numericValue)) {
      setDisplayValue("");
      onChange(0); // El valor numérico base lo informamos como 0 si está vacío
    } else {
      // Actualizamos UI visual (con puntos) e informamos el Integer al objeto Padre
      setDisplayValue(formatNumber(rawValue));
      onChange(numericValue);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`w-full border border-gray-300 rounded-md py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono tracking-wider ${className || ""}`}
      value={displayValue}
      onChange={handleChange}
      onFocus={(e) => {
        // Seleccionar todo el texto (si hubiera) para mejor UX en inputs numéricos
        if (props.onFocus) props.onFocus(e);
      }}
      {...props}
    />
  );
}
