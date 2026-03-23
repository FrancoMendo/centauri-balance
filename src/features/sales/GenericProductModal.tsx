import { useState, useEffect } from "react";
import { X, Plus, Clock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PriceInput } from "../../components/PriceInput";

interface GenericProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (nombre: string, monto: number) => void;
}

export function GenericProductModal({ isOpen, onClose, onAdd }: GenericProductModalProps) {
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState<number>(0);
  const [frequentNames, setFrequentNames] = useState<string[]>([]);

  // Load frequent names from localStorage
  useEffect(() => {
    if (isOpen) {
      setNombre("");
      setMonto(0);
      try {
        const stored = localStorage.getItem("centauri_frequent_generics");
        if (stored) {
          const dict: Record<string, number> = JSON.parse(stored);
          // Sort by frequency descending and take top 20
          const sorted = Object.entries(dict)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map((entry) => entry[0]);
          setFrequentNames(sorted);
        }
      } catch (e) {
        console.error("Error reading generic names", e);
      }
    }
  }, [isOpen]);

  const saveToFrequent = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const stored = localStorage.getItem("centauri_frequent_generics");
      const dict: Record<string, number> = stored ? JSON.parse(stored) : {};
      dict[trimmed] = (dict[trimmed] || 0) + 1;
      localStorage.setItem("centauri_frequent_generics", JSON.stringify(dict));
    } catch (e) {
      console.error("Error saving generic name", e);
    }
  };

  const handleAdd = () => {
    const finalName = nombre.trim() || "Producto sin código";
    saveToFrequent(finalName);
    onAdd(finalName, monto);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Ítem sin código
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Descripción</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Pan, Fiambre, Varios..."
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && monto > 0) handleAdd();
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario / Monto</label>
              <PriceInput
                value={monto}
                onChange={(val) => setMonto(val)}
                className="w-full text-lg py-2"
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && monto > 0) handleAdd();
                }}
              />
            </div>
          </div>

          {frequentNames.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-semibold uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Frecuentes
              </label>
              <div className="flex flex-wrap gap-2">
                {frequentNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNombre(n)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 rounded-full text-sm font-medium transition-colors border border-transparent hover:border-emerald-200"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Agregar al Carrito
          </Button>
        </div>
      </div>
    </div>
  );
}
