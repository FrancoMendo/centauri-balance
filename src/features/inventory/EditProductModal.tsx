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
  const [margen, setMargen] = useState<string>("");

  useEffect(() => {
    if (isOpen && product) {
      setFormData(product);
      if (product.precio_lista && product.precio_lista > 0 && product.precio_venta) {
        const m = ((product.precio_venta / product.precio_lista) - 1) * 100;
        setMargen(m.toFixed(2).replace(/\.00$/, ""));
      } else {
        setMargen("");
      }
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      setFormData({});
      setMargen("");
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

  const handlePrecioListaChange = (val: number) => {
    setFormData(prev => ({ ...prev, precio_lista: val }));
    const m = parseFloat(margen);
    if (!isNaN(m) && val >= 0) {
       const newPrecioVenta = Math.round(val * (1 + m / 100));
       setFormData(prev => ({ ...prev, precio_venta: newPrecioVenta }));
    }
  };

  const handlePrecioVentaChange = (val: number) => {
    setFormData(prev => ({ ...prev, precio_venta: val }));
    if (formData.precio_lista && formData.precio_lista > 0) {
       const newMargen = ((val / formData.precio_lista) - 1) * 100;
       setMargen(newMargen.toFixed(2).replace(/\.00$/, "")); 
    }
  };

  const handleMargenChange = (val: string) => {
    setMargen(val);
    const m = parseFloat(val);
    if (!isNaN(m) && formData.precio_lista) {
       const newPrecioVenta = Math.round(formData.precio_lista * (1 + m / 100));
       setFormData(prev => ({ ...prev, precio_venta: newPrecioVenta }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    const productToUpdate = {
      ...formData,
      precio_lista: Number(formData.precio_lista || 0),
      precio_venta: Number(formData.precio_venta || 0),
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-2">
              <div>
                <Label htmlFor="precio_listaE">Precio Lista</Label>
                <PriceInput
                  id="precio_listaE"
                  value={formData.precio_lista || 0}
                  onChange={handlePrecioListaChange}
                />
              </div>

              <div>
                <Label htmlFor="margenE">Ganancia (%)</Label>
                <Input
                  id="margenE"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 30"
                  className="font-mono text-right"
                  value={margen}
                  onChange={(e) => handleMargenChange(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="precio_ventaE">Precio Venta *</Label>
                <PriceInput
                  id="precio_ventaE"
                  required
                  value={formData.precio_venta || 0}
                  onChange={handlePrecioVentaChange}
                />
              </div>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
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
