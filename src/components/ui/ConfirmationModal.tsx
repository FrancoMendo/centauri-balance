import { X, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { twMerge } from "tailwind-merge";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "warning";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  description = "¿Estás seguro de que deseas realizar esta acción?",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  isLoading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const iconMap = {
    danger: <AlertCircle className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
    primary: <HelpCircle className="w-6 h-6" />
  };

  const iconContainerClasses = {
    danger: "text-rose-600 bg-rose-50 border-rose-100",
    warning: "text-amber-600 bg-amber-50 border-amber-100",
    primary: "text-blue-600 bg-blue-50 border-blue-100"
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-9999 animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className={twMerge("p-3 rounded-2xl border flex items-center justify-center shadow-sm", iconContainerClasses[variant])}>
              {iconMap[variant]}
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-gray-100 rounded-full transition-all duration-200 group active:scale-95"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="px-6 py-4 bg-gray-50/80 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="sm:w-32 border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            variant={variant === "warning" ? "primary" : variant}
            className={twMerge(
              "sm:w-32 shadow-lg transition-transform active:scale-95",
              variant === "warning" && "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-200"
            )}
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
