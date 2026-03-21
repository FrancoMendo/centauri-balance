import { useEffect, useRef, useState } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { X, Save } from "lucide-react";
import { Producto } from "../../lib/schema";
import { PriceInput } from "../../components/PriceInput";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Label";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Producto | null;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const updateProduct = useInventoryStore((state) => state.updateProduct);
  const isLoading = useInventoryStore((state) => state.isLoading);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Producto>>({});

  useEffect(() => {
    if (isOpen && product) {
      setFormData(product);
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      setFormData({});
    }
  }, [isOpen, product]);

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

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    const productToUpdate = {
      ...formData,
      precio: Number(formData.precio),
      stock: Number(formData.stock)
    };
    
    await updateProduct(product.id_producto, productToUpdate);
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
          <h3 className="text-xl font-semibold text-gray-800">Editar Producto ID {product.id_producto}</h3>
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
              <Label htmlFor="nombreE">Nombre *</Label>
              <Input
                ref={firstInputRef}
                id="nombreE"
                type="text"
                required
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="precioE">Precio *</Label>
              <PriceInput
                id="precioE"
                required
                value={formData.precio || 0}
                onChange={(numericValue: number) => setFormData({ ...formData, precio: numericValue })}
              />
            </div>

            <div>
              <Label htmlFor="stockE">Stock</Label>
              <Input
                id="stockE"
                type="number"
                min="0"
                className="font-mono"
                value={formData.stock !== undefined ? formData.stock : ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="codigo_barrasE">Cód. de Barras</Label>
              <Input
                id="codigo_barrasE"
                type="text"
                className="font-mono"
                value={formData.codigo_barras || ""}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="categoriaE">Categoría</Label>
              <Input
                id="categoriaE"
                type="text"
                value={formData.categoria || ""}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descripcionE">Descripción corta</Label>
              <textarea
                id="descripcionE"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none shadow-sm"
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
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
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
