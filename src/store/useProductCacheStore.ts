import { create } from "zustand";
import { getDb } from "../lib/db";
import { productos } from "../lib/schema";
import type { Producto } from "../lib/schema";

interface ProductCacheState {
  products: Producto[];
  byBarcode: Map<string, Producto>;
  isLoaded: boolean;
  isLoading: boolean;

  /** Trae todos los productos en una sola consulta y arma el índice en memoria. */
  loadCache: () => Promise<void>;

  /** Búsqueda por texto 100% en memoria (sin tocar SQLite). */
  searchCache: (query: string, limit?: number) => Producto[];

  /** Lookup exacto por código de barras, O(1) vía Map. */
  findByBarcodeCache: (barcode: string) => Producto | null;
}

export const useProductCacheStore = create<ProductCacheState>((set, get) => ({
  products: [],
  byBarcode: new Map(),
  isLoaded: false,
  isLoading: false,

  loadCache: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const db = await getDb();
      const rows = (await db.select().from(productos)) as Producto[];

      const byBarcode = new Map<string, Producto>();
      for (const p of rows) {
        if (p.codigo_barras) byBarcode.set(p.codigo_barras, p);
      }

      set({ products: rows, byBarcode, isLoaded: true, isLoading: false });
    } catch (error) {
      console.error("Error cargando caché de productos:", error);
      set({ isLoading: false });
    }
  },

  searchCache: (query, limit = 20) => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const { products } = get();
    const results: Producto[] = [];

    for (const p of products) {
      const matches =
        p.nombre.toLowerCase().includes(term) ||
        (p.codigo_barras?.toLowerCase().includes(term) ?? false) ||
        (p.categoria?.toLowerCase().includes(term) ?? false);

      if (matches) {
        results.push(p);
        if (results.length >= limit) break;
      }
    }

    return results;
  },

  findByBarcodeCache: (barcode) => {
    return get().byBarcode.get(barcode) ?? null;
  },
}));
