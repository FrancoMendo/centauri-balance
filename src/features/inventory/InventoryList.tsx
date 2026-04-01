import { useEffect, useState, useRef } from "react";
import { useInventoryStore, PRODUCTS_PER_PAGE } from "../../store/useInventoryStore";
import { Package, Plus, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { Producto } from "../../lib/schema";
import { Button } from "../../components/ui/Button";

/** Delay en ms para debounce de búsqueda */
const SEARCH_DEBOUNCE_MS = 300;

export function InventoryList() {
  const {
    products,
    totalCount,
    currentPage,
    searchTerm,
    isLoading,
    error,
    fetchProductsPage,
    setSearchTerm,
    setPage,
    findByBarcode,
  } = useInventoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Variables de escaner de código de barras global
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const lastScannedCodeRef = useRef("");
  const lastScannedTimeRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  // Cargar primera página al montar
  useEffect(() => {
    fetchProductsPage(1, "");
  }, [fetchProductsPage]);

  // Debounce de búsqueda local → SQL
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [localSearch, searchTerm, setSearchTerm]);

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

          // Buscar por código de barras directo en SQLite
          e.preventDefault();
          e.stopPropagation();
          setLocalSearch(code);

          findByBarcode(code).then((match) => {
            if (match) {
              setProductToEdit(match);
            }
          });
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalBarcode, { capture: true });
    return () => window.removeEventListener("keydown", handleGlobalBarcode, { capture: true });
  }, [findByBarcode]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Inventario
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({totalCount.toLocaleString("es-AR")} productos)
          </span>
        </h2>
        <div className="flex items-center justify-end w-full max-w-xl gap-4">
          <div className="relative w-full max-w-sm hidden sm:block">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar (Ej: nombre, código de barras...)"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    {searchTerm ? "No se encontraron productos con esa búsqueda." : "No hay productos en el inventario."}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación UI */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4 bg-white rounded-b-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
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

      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
      />
    </div>
  );
}
