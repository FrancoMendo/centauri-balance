import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingCart, Barcode, Banknote, Trash2, Plus, Minus, X } from "lucide-react";
import { useSalesStore } from "../store/useSalesStore";
import { useInventoryStore } from "../store/useInventoryStore";
import { PriceInput } from "../components/PriceInput";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { toast } from "sonner";
import { GenericProductModal } from "../features/sales/GenericProductModal";
import { getDb } from "../lib/db";
import { productos as productosTable } from "../lib/schema";
import { eq, sql } from "drizzle-orm";
import { ventas, metodos_pago as pmTable } from "../lib/schema";
import { logAction } from "../lib/logger";
import { localTimestamp } from "../lib/localTimestamp";
import type { Producto } from "../lib/schema";

const GENERIC_BARCODE = "NO_CODE_GENERIC";

/** Delay en ms para debounce de búsqueda por texto */
const SEARCH_DEBOUNCE_MS = 250;

export function SalesPanel() {
  const { cart, addToCart, removeFromCart, updateQuantity, updatePrice, clearCart, getTotal, getItemCount, searchQuery, setSearchQuery } = useSalesStore();
  const { searchProductsSQL, findByBarcode } = useInventoryStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentMethodsList, setPaymentMethodsList] = useState<{ nombre: string; comision: number }[]>([]);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);

  // Ref para debounce timer
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Referencias para escaneo en segundo plano (Pistola Láser)
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const lastScannedCodeRef = useRef("");
  const lastScannedTimeRef = useRef(0);

  // Inicializar métodos de pago
  useEffect(() => {
    async function initPM() {
      try {
        const db = await getDb();
        let methods = await db.select().from(pmTable);

        if (methods.length === 0) {
          // Sembrar por defecto
          await db.insert(pmTable).values([
            { nombre: "Efectivo", comision_porcentaje: 0 },
            { nombre: "Tarjeta Débito", comision_porcentaje: 3 },
            { nombre: "Tarjeta Crédito", comision_porcentaje: 8 },
            { nombre: "QR Mercado Pago", comision_porcentaje: 15 },
          ]);
          methods = await db.select().from(pmTable);
        }

        setPaymentMethodsList(methods.map((m: any) => ({
          nombre: m.nombre,
          comision: m.comision_porcentaje
        })));
        if (methods.length > 0) setPaymentMethod(methods[0].nombre);

        // Asegurarnos de que el "Producto Genérico" exista en la BD para ventas sin código
        try {
          const resGenerico = await db.select().from(productosTable).where(eq(productosTable.codigo_barras, GENERIC_BARCODE));
          if (resGenerico.length === 0) {
            await db.insert(productosTable).values({
              nombre: "Productos sin código",
              categoria: "Varios",
              precio_lista: 0,
              precio_venta: 0,
              stock: 999999,
              codigo_barras: GENERIC_BARCODE,
              descripcion: "Venta manual sin código",
            } as any).onConflictDoNothing();
          }
        } catch (e) {
          // Ignorar posibles choques silenciosos de UNIQUE
        }
      } catch (error) {
        console.error("Error al inicializar Panel de Ventas", error);
      }
    }
    initPM();
  }, []);

  // Buscar productos con debounce cuando cambia el query — DELEGADO A SQLITE
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Limpiar timer previo (debounce)
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      const results = await searchProductsSQL(searchQuery.trim(), 20);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSelectedResultIndex(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, searchProductsSQL]);

  // Atajos globales: Alt+B para buscador, Alt+N para ítem manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsGenericModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Detector Global de Pistola de Código de Barras — BUSCA DIRECTO EN SQLITE
  useEffect(() => {
    const handleGlobalBarcode = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const timeNow = performance.now();
      if (timeNow - lastKeyTimeRef.current > 50) {
        bufferRef.current = "";
      } else {
        if (document.activeElement === searchInputRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      lastKeyTimeRef.current = timeNow;

      if (e.key === "Enter") {
        const code = bufferRef.current;
        bufferRef.current = "";
        
        if (code.length >= 3) {
          const dateNow = Date.now();
          if (lastScannedCodeRef.current === code && (dateNow - lastScannedTimeRef.current < 800)) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          
          lastScannedCodeRef.current = code;
          lastScannedTimeRef.current = dateNow;

          // Búsqueda directa en SQLite por código de barras (no en array en memoria)
          e.preventDefault();
          e.stopPropagation();
          
          findByBarcode(code).then((product) => {
            if (product) {
              addToCart(product);
              if (document.activeElement === searchInputRef.current) {
                setSearchQuery("");
                setShowResults(false);
                searchInputRef.current?.blur();
              }
            } else {
              toast.error(`Producto no encontrado: ${code}`);
            }
          });
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleGlobalBarcode, { capture: true });
    return () => window.removeEventListener("keydown", handleGlobalBarcode, { capture: true });
  }, [addToCart, setSearchQuery, findByBarcode]);

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
          searchInputRef.current?.blur();
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
      const id_operacion = crypto.randomUUID();
      const selectedPM = paymentMethodsList.find(m => m.nombre === paymentMethod);
      const commission = selectedPM ? selectedPM.comision : 0;

      for (const item of cart) {
        let dbProductId = item.product.id_producto;

        // Si es un ítem manual/huérfano (ID negativo), buscamos su nombre o lo auto-creamos
        if (dbProductId < 0) {
          const matchRows = await db.select().from(productosTable).where(eq(productosTable.nombre, item.product.nombre));
          if (matchRows.length > 0) {
            dbProductId = matchRows[0].id_producto;
          } else {
            const insertResult = await db.insert(productosTable).values({
              nombre: item.product.nombre,
              categoria: "Varios",
              precio_lista: item.product.precio_venta,
              precio_venta: item.product.precio_venta,
              stock: 999999,
              codigo_barras: null,
              descripcion: "Autocreado en caja rápida",
            }).returning({ id: productosTable.id_producto });
            
            if (insertResult.length > 0) {
               dbProductId = insertResult[0].id;
            } else {
               const latest = await db.select().from(productosTable).where(eq(productosTable.nombre, item.product.nombre));
               dbProductId = latest[0].id_producto;
            }
          }
        }

        // Registrar la venta
        await db.insert(ventas).values({
          id_operacion,
          id_producto: dbProductId,
          cantidad: item.quantity,
          precio_venta: item.product.precio_venta,
          metodo_pago: paymentMethod,
          comision_porcentaje: commission,
          fecha: localTimestamp(),
          id_usuario: 1,
        });

        // Descontar stock del producto
        await db
          .update(productosTable)
          .set({ stock: sql`${productosTable.stock} - ${item.quantity}` })
          .where(eq(productosTable.id_producto, dbProductId));

        // Si el producto original NO tenía precio ($0) y se lo establecimos en caja, lo guardamos permanentemente
        if (dbProductId > 0 && item.product.id_producto > 0) {
          // Re-consultar el precio actual en la BD para comparar (no depender de array en memoria)
          const currentRows = await db.select({ precio_venta: productosTable.precio_venta })
            .from(productosTable)
            .where(eq(productosTable.id_producto, item.product.id_producto))
            .limit(1);
          
          if (currentRows.length > 0 && currentRows[0].precio_venta === 0 && item.product.precio_venta > 0) {
            await db
              .update(productosTable)
              .set({ precio_venta: item.product.precio_venta })
              .where(eq(productosTable.id_producto, item.product.id_producto));
          }
        }
      }

      clearCart();
      await logAction(`Venta registrada exitosamente por $${total.toFixed(2)} (${cart.length} ítems, Medio: ${paymentMethod})`);
      toast.success("Venta registrada con éxito.");
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      await logAction(`Error intentando registrar venta: ${(error as Error).message}`);
      toast.error("Error al procesar la venta: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Atajo global: Enter para cobrar cuando foco no está en el buscador
  useEffect(() => {
    const handleGlobalEnter = (e: KeyboardEvent) => {
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

  const handleAddGenericClick = () => {
    setIsGenericModalOpen(true);
  };

  const handleConfirmGenericProduct = (nombre: string, monto: number) => {
    const fakeId = -Math.round(performance.now() + Math.random() * 1000);
    const orphanGeneric = {
      id_producto: fakeId,
      nombre: nombre,
      categoria: "Varios",
      precio_lista: monto,
      precio_venta: monto,
      stock: 0,
      codigo_barras: null,
      descripcion: "Ingreso manual",
      id_proveedor: null
    };
    addToCart(orphanGeneric as any);
  };

  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            Punto de Venta
          </h1>
          <p className="text-gray-500 mt-1">
            Escanee o busque productos para registrar la venta
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="flex items-center gap-2 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
            variant="outline"
            onClick={handleAddGenericClick}
            title="Añadir ítem manual como Pan, Fiambre, etc. (Alt+N)"
          >
            <Plus className="w-5 h-5" />
            Sin Código <span className="hidden lg:inline-block ml-1 text-xs opacity-60 font-mono">(Alt+N)</span>
          </Button>

          {cart.length > 0 && (
            <Button
              variant="danger"
              onClick={clearCart}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Vaciar
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Búsqueda + Carrito */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <div className="flex items-center gap-3">
              <Input
                ref={searchInputRef}
                icon={<Barcode className="w-5 h-5 text-emerald-600" />}
                type="text"
                placeholder="Escanear código de barras o buscar producto (Foco con Alt+B)"
                className="text-lg py-3 w-full border-gray-200"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true);
                }}
              />
            </div>

            {/* Dropdown de resultados */}
            {showResults && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto">
                {searchResults.map((product, idx) => (
                  <button
                    key={product.id_producto}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${idx === selectedResultIndex
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
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${product.stock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                          }`}
                      >
                        {product.stock} un.
                      </span>
                      <PriceDisplay
                        amount={product.precio_venta}
                        className="font-semibold text-gray-900"
                      />
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
                        <td className="py-3 px-4 text-right">
                          <div className="w-24 ml-auto">
                            <PriceInput
                              value={item.product.precio_venta}
                              onChange={(val) => updatePrice(item.product.id_producto, val)}
                              className={`text-right py-1 px-2 text-sm font-semibold text-gray-700 hover:bg-white w-full transition-colors ${item.product.precio_venta === 0 ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/50 text-amber-900 shadow-sm' : 'bg-gray-50 border-gray-200'}`}
                              placeholder={item.product.precio_venta === 0 ? 'Monto requerido' : undefined}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                          <PriceDisplay amount={item.subtotal} />
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
              <PriceDisplay
                amount={total}
                className="text-4xl font-bold text-gray-900"
              />
            </div>

            <div className="mb-6 space-y-2">
              <label className="text-sm font-medium text-gray-700">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow transition-colors"
                disabled={isProcessing}
              >
                {paymentMethodsList.map(pm => (
                  <option key={pm.nombre} value={pm.nombre}>
                    {pm.nombre} {pm.comision > 0 ? `(-${pm.comision}%)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedPM = paymentMethodsList.find(m => m.nombre === paymentMethod);
              const commission = selectedPM?.comision || 0;
              const lossAmount = total * (commission / 100);
              if (commission > 0) {
                return (
                  <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-3 flex justify-between items-center text-sm">
                    <span className="text-red-700 font-medium">Comisión retención ({commission}%)</span>
                    <PriceDisplay
                      amount={-lossAmount}
                      className="text-red-600 font-bold"
                      prefix=""
                    />
                  </div>
                );
              }
              return null;
            })()}

            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              <Banknote className="w-6 h-6" />
              {isProcessing ? "Procesando..." : "Cobrar (F12)"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal para Items Manuales / Sin Código */}
      <GenericProductModal 
        isOpen={isGenericModalOpen}
        onClose={() => setIsGenericModalOpen(false)}
        onAdd={handleConfirmGenericProduct}
      />
    </div>
  );
}
