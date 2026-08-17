import { memo } from "react";
import { Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PRODUCTS_PER_PAGE } from "../../store/useInventoryStore";
import { Producto } from "../../lib/schema";

interface ProductsTableProps {
  products: Producto[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  onEdit: (product: Producto) => void;
  onSetPage: (page: number) => void;
}

/**
 * Memoizado: el buscador de arriba (InventoryList) actualiza `localSearch` en
 * cada tecla, lo que re-renderizaba esta tabla completa (todas las filas de
 * la página actual) aunque `products` no hubiera cambiado todavía (el fetch
 * real está debounced). En equipos de bajos recursos (2 núcleos/3GB RAM) eso
 * se sentía como lag de tipeo, igual que pasaba antes con CartTable. Al
 * memoizar, React la saltea mientras `products`/`currentPage`/etc. no
 * cambien.
 */
export const ProductsTable = memo(function ProductsTable({
  products,
  totalCount,
  currentPage,
  totalPages,
  searchTerm,
  isLoading,
  error,
  onEdit,
  onSetPage,
}: ProductsTableProps) {
  if (isLoading) {
    return <p className="text-gray-500">Cargando productos...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Nombre</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Precio Lista</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Precio Venta</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600">Stock</th>
              <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  {searchTerm ? "No se encontraron productos con esa búsqueda." : "No hay productos en el inventario."}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id_producto} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-800">{p.id_producto}</td>
                  <td className="py-3 px-4 text-gray-800 font-medium">{p.nombre}</td>
                  <td className="py-3 px-4 text-gray-500">${p.precio_lista}</td>
                  <td className="py-3 px-4 text-primary-600 font-semibold">${p.precio_venta}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(p)}
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

      {/* Paginación UI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4 bg-white rounded-b-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => onSetPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => onSetPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}</span> a <span className="font-medium">{Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)}</span> de <span className="font-medium">{totalCount.toLocaleString("es-AR")}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => onSetPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                  Página {currentPage} de {totalPages.toLocaleString("es-AR")}
                </span>
                <button
                  onClick={() => onSetPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
