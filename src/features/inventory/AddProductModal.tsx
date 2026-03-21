import { useEffect, useRef, useState } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { X, Save } from "lucide-react";
import { NewProducto } from "../../lib/schema";
import { PriceInput } from "../../components/PriceInput";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Label";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const addProduct = useInventoryStore((state) => state.addProduct);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<NewProducto>({
    nombre: "",
    categoria: "",
    precio: 0,
    stock: 0,
    codigo_barras: "",
    descripcion: "",
  });

  // Escuchar la tecla "Escape" para cerrar el modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Hacer focus automático al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      // Limpiar el estado al cerrar
      setFormData({ nombre: "", categoria: "", precio: 0, stock: 0, codigo_barras: "", descripcion: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Convertir de strings a num por si acaso vienen como string desde los inputs
    const productToSave: NewProducto = {
      ...formData,
      precio: Number(formData.precio),
      stock: Number(formData.stock)
    };
    
    await addProduct(productToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-semibold text-gray-800">Cargar Nuevo Producto</h3>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                ref={firstInputRef}
                id="nombre"
                type="text"
                required
                placeholder="Ej. Gaseosa Cola 2L"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="precio">Precio *</Label>
              <PriceInput
                id="precio"
                required
                value={formData.precio}
                onChange={(numericValue: number) => setFormData({ ...formData, precio: numericValue })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                className="font-mono"
                value={formData.stock || ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="codigo_barras">Cód. de Barras</Label>
              <Input
                id="codigo_barras"
                type="text"
                placeholder="Ej. 779123456"
                className="font-mono"
                value={formData.codigo_barras || ""}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                type="text"
                placeholder="Ej. Bebidas"
                value={formData.categoria || ""}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descripcion">Descripción corta</Label>
              <textarea
                id="descripcion"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none shadow-sm"
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <span className="font-semibold text-gray-600 mr-1 uppercase tracking-wider">Atajos:</span>
              
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded shadow-sm font-mono font-medium text-gray-700">Tab</kbd>
                <span>/</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded shadow-sm font-mono font-medium text-gray-700">⇧ Tab</kbd>
                <span>Navegar</span>
              </div>
              
              <span className="text-gray-300 mx-1 hidden sm:inline">|</span>
              
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded shadow-sm font-mono font-medium text-gray-700">Enter</kbd>
                <span>Guardar</span>
              </div>
              
              <span className="text-gray-300 mx-1 hidden sm:inline">|</span>
              
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded shadow-sm font-mono font-medium text-gray-700">Esc</kbd>
                <span>Cancelar</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Guardando..." : "Guardar Producto"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
