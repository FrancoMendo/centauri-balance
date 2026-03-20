import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingCart, Barcode, Banknote, Trash2, Plus, Minus, X } from "lucide-react";
import { useSalesStore } from "../store/useSalesStore";
import { useInventoryStore } from "../store/useInventoryStore";
import { getDb } from "../lib/db";
import { productos as productosTable } from "../lib/schema";
import { eq, sql } from "drizzle-orm";
import { ventas } from "../lib/schema";

export function SalesPanel() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount, searchQuery, setSearchQuery } = useSalesStore();
  const { products, fetchProducts } = useInventoryStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<typeof products>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Buscar productos cuando cambia el query
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        (p.codigo_barras && p.codigo_barras.includes(query)) ||
        (p.categoria && p.categoria.toLowerCase().includes(query))
    );

    setSearchResults(filtered);
    setShowResults(filtered.length > 0);
    setSelectedResultIndex(0);

    // Si la búsqueda coincide exactamente con un código de barras, agregar directo
    const exactBarcode = products.find(
      (p) => p.codigo_barras && p.codigo_barras === query
    );
    if (exactBarcode) {
      addToCart(exactBarcode);
      setSearchQuery("");
      setShowResults(false);
    }
  }, [searchQuery, products, addToCart, setSearchQuery]);

  // Atajo global: Alt+B para enfocar el buscador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedResultIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (searchResults.length > 0) {
          addToCart(searchResults[selectedResultIndex]);
          setSearchQuery("");
          setShowResults(false);
        }
      } else if (e.key === "Escape") {
        setShowResults(false);
        setSearchQuery("");
      }
    },
    [searchResults, selectedResultIndex, addToCart, setSearchQuery]
  );

  // Acción de cobrar: registra las ventas en la BD y descuenta stock
  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const db = await getDb();

      for (const item of cart) {
        // Registrar la venta (id_usuario = 1 temporal hasta módulo auth)
        await db.insert(ventas).values({
          id_producto: item.product.id_producto,
          cantidad: item.quantity,
          precio: item.product.precio,
          id_usuario: 1,
        });

        // Descontar stock del producto
        await db
          .update(productosTable)
          .set({ stock: sql`${productosTable.stock} - ${item.quantity}` })
          .where(eq(productosTable.id_producto, item.product.id_producto));
      }

      clearCart();
      // Refrescar inventario para reflejar el nuevo stock
      await fetchProducts();
      alert("✅ Venta registrada con éxito.");
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      alert("❌ Error al procesar la venta: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Atajo global: Enter para cobrar cuando foco no está en el buscador
  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
      // Solo si no estamos escribiendo en el buscador y el carrito tiene items
      if (
        e.key === "F12" &&
        cart.length > 0 &&
        !isProcessing
      ) {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handleGlobalEnter);
    return () => window.removeEventListener("keydown", handleGlobalEnter);
  });

  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            Punto de Venta
          </h1>
          <p className="text-gray-500 mt-1">
            Escanee o busque productos para registrar la venta
          </p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
          >
            <X className="w-4 h-4" />
            Vaciar Carrito
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Búsqueda + Carrito */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <Barcode className="text-gray-400 w-6 h-6 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escanear código de barras o buscar producto..."
                className="w-full bg-transparent outline-none text-lg text-gray-800 placeholder:text-gray-400 font-medium"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
              />
              <kbd className="hidden sm:inline-block text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                Alt+B
              </kbd>
            </div>

            {/* Dropdown de resultados */}
            {showResults && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto">
                {searchResults.map((product, idx) => (
                  <button
                    key={product.id_producto}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      idx === selectedResultIndex
                        ? "bg-blue-50 text-blue-800"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addToCart(product);
                      setSearchQuery("");
                      setShowResults(false);
                      searchInputRef.current?.focus();
                    }}
                    onMouseEnter={() => setSelectedResultIndex(idx)}
                  >
                    <div>
                      <span className="font-medium">{product.nombre}</span>
                      {product.codigo_barras && (
                        <span className="ml-2 text-xs text-gray-400 font-mono">
                          {product.codigo_barras}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          product.stock > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {product.stock} un.
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${product.precio.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabla del carrito */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[460px] flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400 flex flex-col items-center">
                  <ShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
                  <p className="font-medium text-lg">El carrito está vacío</p>
                  <p className="text-sm mt-1">
                    Busque un producto arriba o escanee un código de barras
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4 text-center">Cantidad</th>
                      <th className="py-3 px-4 text-right">Precio Unit.</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map((item) => (
                      <tr
                        key={item.product.id_producto}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-800">
                            {item.product.nombre}
                          </span>
                          {item.product.codigo_barras && (
                            <span className="block text-xs text-gray-400 font-mono mt-0.5">
                              {item.product.codigo_barras}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id_producto,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              className="w-16 text-center font-mono font-semibold text-gray-800 border border-gray-200 rounded-md py-1 outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={item.quantity || ''}
                              onChange={(e) =>
                                updateQuantity(
                                  item.product.id_producto,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                                  updateQuantity(item.product.id_producto, 1);
                                }
                              }}
                            />
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id_producto,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          ${item.product.precio.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                          ${item.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              removeFromCart(item.product.id_producto)
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Quitar del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Resumen y Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" /> Resumen de
            Venta
          </h3>

          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
              <span>Artículos en carrito</span>
              <span className="font-medium text-gray-900">
                {itemCount} un.
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
              <span>Líneas de productos</span>
              <span className="font-medium text-gray-900">{cart.length}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-6">
            <div className="flex justify-between items-end mb-6">
              <span className="text-gray-500 font-medium tracking-wide uppercase text-sm">
                Total a cobrar
              </span>
              <span className="text-4xl font-bold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-4 text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
              <Banknote className="w-6 h-6 relative z-10" />
              <span className="relative z-10">
                {isProcessing ? "Procesando..." : "Cobrar (F12)"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
