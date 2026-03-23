import { useEffect, useState, useRef, useMemo } from "react";
import { useInventoryStore } from "../../store/useInventoryStore";
import { Package, Plus, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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

          // Buscar y si existe, abrir el modal de edición al instante
          const match = products.find(p => p.codigo_barras === code);
          if (match) {
            setProductToEdit(match);
          }
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalBarcode, { capture: true });
    return () => window.removeEventListener("keydown", handleGlobalBarcode, { capture: true });
  }, [products]);

  const baseFilteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term)) ||
        p.id_producto.toString() === term ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const totalPages = Math.ceil(baseFilteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return baseFilteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [baseFilteredProducts, currentPage]);

  // Reiniciar la página al escribir
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {searchTerm ? "No se encontraron productos con esa búsqueda." : "No hay productos en el inventario."}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, baseFilteredProducts.length)}</span> de <span className="font-medium">{baseFilteredProducts.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
