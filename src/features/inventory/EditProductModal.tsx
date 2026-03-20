import { useEffect, useRef, useState } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { X, Save } from "lucide-react";
import { Producto } from "../../lib/schema";
import { PriceInput } from "../../components/PriceInput";

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
              <label htmlFor="nombreE" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                ref={firstInputRef}
                id="nombreE"
                type="text"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="precioE" className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <PriceInput
                id="precioE"
                required
                value={formData.precio || 0}
                onChange={(numericValue: number) => setFormData({ ...formData, precio: numericValue })}
              />
            </div>

            <div>
              <label htmlFor="stockE" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                id="stockE"
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                value={formData.stock !== undefined ? formData.stock : ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div>
              <label htmlFor="codigo_barrasE" className="block text-sm font-medium text-gray-700 mb-1">Cód. de Barras</label>
              <input
                id="codigo_barrasE"
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                value={formData.codigo_barras || ""}
                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="categoriaE" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                id="categoriaE"
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={formData.categoria || ""}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="descripcionE" className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
              <textarea
                id="descripcionE"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
             <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
