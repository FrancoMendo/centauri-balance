import { useEffect, useState, useRef } from "react";
import { useInventoryStore, PRODUCTS_PER_PAGE } from "../../store/useInventoryStore";
import { Package, Plus, Search } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { ProductsTable } from "./ProductsTable";
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

      <ProductsTable
        products={products}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        searchTerm={searchTerm}
        isLoading={isLoading}
        error={error}
        onEdit={setProductToEdit}
        onSetPage={setPage}
      />

      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
      />
    </div>
  );
}
