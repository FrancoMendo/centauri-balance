import { useEffect, useState } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { Producto } from "../../lib/schema";
import { Button } from "../../components/ui/Button";

export function InventoryList() {
  const { products, isLoading, error, fetchProducts, deleteProduct } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro que deseas eliminar este producto?")) {
      await deleteProduct(id);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejo de atajos de teclado globales (Alt+N ó Ctrl+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si estamos tipeando en un input o contenteditable a menos que apretemos la combinacion intencionalemente, 
      // Igual el Alt/Ctrl previene conflictos de tipeo normal.
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault(); // Evitamos que el navegador abra una nueva ventana u otra cosa default
        setIsModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Inventario
        </h2>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
            Alt+N / Ctrl+N
          </span>
          <Button 
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 text-white" />
            Nuevo Producto
          </Button>
        </div>
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No hay productos en el inventario.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
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
                       <button 
                         onClick={() => handleDelete(p.id_producto)}
                         title="Eliminar"
                         className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
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
