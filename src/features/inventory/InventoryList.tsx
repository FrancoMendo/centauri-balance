import { useEffect, useState, useRef, useMemo } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { Package, Plus, Edit2, Search } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { Producto } from "../../lib/schema";
import { Button } from "../../components/ui/Button";

export function InventoryList() {
  const { products, isLoading, error, fetchProducts } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Variables de escaner de código de barras global
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const lastScannedCodeRef = useRef("");
  const lastScannedTimeRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejo de atajos de teclado globales (Alt+N ó Ctrl+N) y Escáner de Barras
  useEffect(() => {
    const handleGlobalBarcode = (e: KeyboardEvent) => {
      // Ignorar combinaciones especiales
      if (e.altKey || e.ctrlKey || e.metaKey) {
        if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
          e.preventDefault();
          setIsModalOpen(true);
        }
        return;
      }

      // Detector de teclado rápido (Pistola de código)
      const timeNow = performance.now();
      if (timeNow - lastKeyTimeRef.current > 50) {
        bufferRef.current = ""; // Reset de humano lento
      }
      lastKeyTimeRef.current = timeNow;

      if (e.key === "Enter") {
        const code = bufferRef.current;
        bufferRef.current = ""; 
        
        if (code.length >= 3) {
          // Anti-duplicado por láser de metralleta
          const dateNow = Date.now();
          if (lastScannedCodeRef.current === code && (dateNow - lastScannedTimeRef.current < 800)) {
            e.preventDefault();
            e.stopPropagation();
            return; 
          }
          
          lastScannedCodeRef.current = code;
          lastScannedTimeRef.current = dateNow;

          // Impactar el buscador para ubicar el producto
          e.preventDefault();
          e.stopPropagation();
          setSearchTerm(code);
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };
    
    window.addEventListener("keydown", handleGlobalBarcode, { capture: true });
    return () => window.removeEventListener("keydown", handleGlobalBarcode, { capture: true });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 200); // 200 max rendered to limit DOM freezing
    
    const term = searchTerm.toLowerCase().trim();
    return products.filter(
      (p) => 
        p.nombre.toLowerCase().includes(term) || 
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
        p.id_producto.toString() === term ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
    ).slice(0, 100);
  }, [products, searchTerm]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Inventario
        </h2>
        <div className="flex items-center justify-end w-full max-w-xl gap-4">
          <div className="relative w-full max-w-sm hidden sm:block">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar (Ej: nombre, código de barras...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full bg-gray-50 border-gray-200"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:inline-block text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              Alt+N / Ctrl+N
            </span>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 text-white" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="sm:hidden relative w-full mb-6">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 w-full"
        />
      </div>

      {isLoading && <p className="text-gray-500">Cargando productos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Categoría</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Precio Lista</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Precio Venta</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {searchTerm ? "No se encontraron productos con esa búsqueda." : "No hay productos en el inventario."}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id_producto} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">{p.id_producto}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{p.nombre}</td>
                    <td className="py-3 px-4 text-gray-600">{p.categoria || "-"}</td>
                    <td className="py-3 px-4 text-gray-500">${p.precio_lista}</td>
                    <td className="py-3 px-4 text-primary-600 font-semibold">${p.precio_venta}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-4 flex items-center justify-end gap-2">
                       <button 
                         onClick={() => setProductToEdit(p)}
                         title="Editar"
                         className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                       >
                         <Edit2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditProductModal 
        isOpen={!!productToEdit} 
        onClose={() => setProductToEdit(null)} 
        product={productToEdit} 
      />
    </div>
  );
}
