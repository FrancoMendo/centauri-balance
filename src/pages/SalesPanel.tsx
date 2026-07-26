import { useEffect, useRef, useState, useCallback } from "react";
import { Barcode, Plus, X } from "lucide-react";
import { useSalesStore } from "../store/useSalesStore";
import { useInventoryStore } from "../store/useInventoryStore";
import { usePerformanceModeStore } from "../store/usePerformanceModeStore";
import { useProductCacheStore } from "../store/useProductCacheStore";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { toast } from "sonner";
import { GenericProductModal } from "../features/sales/GenericProductModal";
import { CartTable } from "../features/sales/CartTable";
import { OrderSummaryPanel } from "../features/sales/OrderSummaryPanel";
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

/**
 * Umbral máximo (ms) entre teclas consecutivas para considerarlas parte de un
 * mismo escaneo de pistola. En WebKitGTK (Debian/Linux) el despacho de eventos
 * de teclado tiene más latencia/jitter que en WebView2 (Windows), por lo que un
 * umbral bajo (ej. 50ms) hace que caracteres del lector se traten como tecleo
 * humano y se filtren al input en vez de bloquearse.
 */
const BARCODE_SCAN_KEY_GAP_MS = 120;

/**
 * Tolerancia (ms) para el Enter/CR final que manda el lector como terminador.
 * Suele llegar con más latencia que los dígitos entre sí (procesamiento extra
 * de la tecla especial), así que usa un margen más generoso que
 * BARCODE_SCAN_KEY_GAP_MS para no perder el buffer justo al terminar el escaneo.
 */
const BARCODE_SCAN_ENTER_GAP_MS = 500;

export function SalesPanel() {
  const { cart, addToCart, removeFromCart, updateQuantity, updatePrice, clearCart, getTotal, getItemCount, searchQuery, setSearchQuery } = useSalesStore();
  const { searchProductsSQL, findByBarcode } = useInventoryStore();
  const performanceMode = usePerformanceModeStore((state) => state.enabled);
  const { loadCache, searchCache, findByBarcodeCache } = useProductCacheStore();
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
  // Respaldo cuando el lector no manda terminador Enter/CR: si tras una
  // ráfaga de caracteres no llega nada más en este lapso, se procesa el
  // buffer igual.
  const scanFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refuerzo del autoFocus: en el webview de Debian el foco inicial vía
  // atributo autoFocus a veces no se aplica a tiempo (carga vía lazy/Suspense).
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Modo Rendimiento: carga (o recarga) el caché en memoria de productos al
  // entrar al panel, para no golpear SQLite en cada tecla del buscador.
  useEffect(() => {
    if (performanceMode) {
      loadCache();
    }
  }, [performanceMode, loadCache]);

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
      const trimmed = searchQuery.trim();

      // Coincidencia exacta de código de barras primero: cubre lectores que
      // no envían Enter como sufijo, agregando el producto sin intervención
      // manual apenas se termina de tipear/escanear el código.
      // Modo Rendimiento: todo se resuelve contra el caché en memoria (sin
      // tocar SQLite), evitando el roundtrip IPC en cada tecla.
      const exactMatch = performanceMode
        ? findByBarcodeCache(trimmed)
        : await findByBarcode(trimmed);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery("");
        setShowResults(false);
        searchInputRef.current?.focus();
        return;
      }

      const results = performanceMode
        ? searchCache(trimmed, 20)
        : await searchProductsSQL(trimmed, 20);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSelectedResultIndex(0);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, searchProductsSQL, findByBarcode, addToCart, performanceMode, searchCache, findByBarcodeCache]);

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
    // Campos donde el usuario puede estar editando texto a mano (cantidad,
    // precio, buscador). Ahí no forzamos el foco de vuelta al buscador.
    const isTextEntryElement = (el: Element | null): boolean => {
      if (!el) return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable;
    };

    // Procesa un código ya armado en el buffer, sin importar si llegó por el
    // terminador Enter/CR o por el respaldo de silencio (ver más abajo).
    const processScannedCode = (code: string) => {
      if (code.length < 3) return;
      const dateNow = Date.now();
      if (lastScannedCodeRef.current === code && (dateNow - lastScannedTimeRef.current < 800)) {
        return;
      }
      lastScannedCodeRef.current = code;
      lastScannedTimeRef.current = dateNow;

      // Búsqueda por código de barras: en Modo Rendimiento contra el caché
      // en memoria, si no directo en SQLite.
      const lookup = performanceMode
        ? Promise.resolve(findByBarcodeCache(code))
        : findByBarcode(code);

      lookup.then((product) => {
        if (product) {
          addToCart(product);
          setSearchQuery("");
          setShowResults(false);
          searchInputRef.current?.focus();
        } else {
          toast.error(`Producto no encontrado: ${code}`);
        }
      });
    };

    const armFallbackTimer = () => {
      if (scanFallbackTimerRef.current) clearTimeout(scanFallbackTimerRef.current);
      // Respaldo para lectores que no mandan terminador Enter/CR (o lo mandan
      // como algo que el navegador no reconoce como "Enter"): si tras una
      // ráfaga de caracteres no llega nada más en este lapso, se procesa el
      // buffer igual, sin esperar al terminador.
      scanFallbackTimerRef.current = setTimeout(() => {
        const code = bufferRef.current;
        bufferRef.current = "";
        processScannedCode(code);
      }, BARCODE_SCAN_ENTER_GAP_MS);
    };

    const handleGlobalBarcode = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      // Repetición por mantener una tecla apretada (Backspace, una letra,
      // etc.): el SO la genera con gaps tan chicos como los de la pistola,
      // pero nunca viene de un escaneo real. Se deja pasar sin tocarla.
      if (e.repeat) return;

      const timeNow = performance.now();
      const gap = timeNow - lastKeyTimeRef.current;

      // El Enter/CR terminador del lector se procesa ANTES de cualquier
      // lógica de reseteo por timing: si se tratara igual que un carácter
      // más, un gap grande respecto al último dígito (común en el
      // terminador, que suele tener más latencia que los dígitos entre sí)
      // borraría el buffer justo antes de leerlo, perdiendo el código ya
      // escaneado en silencio (sin toast de error ni producto agregado).
      // Se usa una tolerancia más generosa (BARCODE_SCAN_ENTER_GAP_MS) que
      // la de los dígitos entre sí para aceptar esa latencia extra, pero
      // sigue exigiendo que el Enter llegue poco después del último
      // carácter, para no confundirlo con un Enter manual y tardío del
      // usuario sobre contenido residual del buffer.
      if (e.key === "Enter") {
        if (scanFallbackTimerRef.current) {
          clearTimeout(scanFallbackTimerRef.current);
          scanFallbackTimerRef.current = null;
        }
        const code = gap <= BARCODE_SCAN_ENTER_GAP_MS ? bufferRef.current : "";
        bufferRef.current = "";
        lastKeyTimeRef.current = timeNow;

        if (code.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          processScannedCode(code);
        }
        return;
      }

      // Solo las teclas de un carácter (imprimibles) son candidatas a formar
      // parte de un código escaneado. Teclas de control como Backspace,
      // Delete o las flechas nunca las manda una pistola y jamás deben
      // bloquearse por esta lógica, sin importar la velocidad a la que
      // lleguen (ej. al mantenerlas apretadas o borrar rápido a mano).
      const isCandidateChar = e.key.length === 1;
      const isRapidSuccession = gap <= BARCODE_SCAN_KEY_GAP_MS;

      if (!isCandidateChar) {
        return;
      }

      if (!isRapidSuccession) {
        bufferRef.current = "";
        // Si arranca un posible escaneo (carácter imprimible) y el foco quedó
        // en un control no editable (ej. el <select> de Método de Pago o
        // ningún elemento), lo recuperamos para el buscador: en WebKitGTK
        // (Debian) un <select> nativo puede consumir las teclas del lector
        // antes de que lleguen al DOM, y el escaneo nunca se completa ni
        // agrega el producto.
        if (!isTextEntryElement(document.activeElement)) {
          searchInputRef.current?.focus();
        }
      } else {
        // Una ráfaga de caracteres a menos de BARCODE_SCAN_KEY_GAP_MS es
        // imposible de producir a mano: siempre es la pistola, sin importar
        // qué elemento tenga el foco. La bloqueamos para que no se filtre a
        // otro campo (cantidad, precio, etc).
        e.preventDefault();
        e.stopPropagation();
      }
      lastKeyTimeRef.current = timeNow;

      bufferRef.current += e.key;
      // Arma (o reinicia) el respaldo solo durante una ráfaga real: evita
      // que tecleo humano normal dispare una búsqueda automática no pedida.
      if (isRapidSuccession) {
        armFallbackTimer();
      } else if (scanFallbackTimerRef.current) {
        clearTimeout(scanFallbackTimerRef.current);
        scanFallbackTimerRef.current = null;
      }
    };

    window.addEventListener("keydown", handleGlobalBarcode, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleGlobalBarcode, { capture: true });
      if (scanFallbackTimerRef.current) clearTimeout(scanFallbackTimerRef.current);
    };
  }, [addToCart, setSearchQuery, findByBarcode, performanceMode, findByBarcodeCache]);

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
          searchInputRef.current?.focus();
        }
      } else if (e.key === "Escape") {
        setShowResults(false);
        setSearchQuery("");
      }
    },
    [searchResults, selectedResultIndex, addToCart, setSearchQuery]
  );

  // Acción de cobrar: registra las ventas en la BD y descuenta stock
  const handleCheckout = useCallback(async () => {
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

      // El stock cambió: si el caché en memoria está activo, se refresca
      // para que el buscador no muestre stock desactualizado.
      if (performanceMode) {
        loadCache();
      }
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      await logAction(`Error intentando registrar venta: ${(error as Error).message}`);
      toast.error("Error al procesar la venta: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, [cart, isProcessing, paymentMethod, paymentMethodsList, clearCart, getTotal, performanceMode, loadCache]);

  // Atajo global: F12 para cobrar cuando foco no está en el buscador
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
  }, [cart.length, isProcessing, handleCheckout]);

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
            <CartTable
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updatePrice}
              onRemove={removeFromCart}
            />
          </div>
        </div>

        {/* Panel derecho: Resumen y Total */}
        <OrderSummaryPanel
          total={total}
          itemCount={itemCount}
          lineCount={cart.length}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          paymentMethodsList={paymentMethodsList}
          isProcessing={isProcessing}
          canCheckout={cart.length > 0}
          onCheckout={handleCheckout}
        />
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
