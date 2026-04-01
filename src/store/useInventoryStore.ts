import { create } from "zustand";
import { Producto, NewProducto } from "../lib/schema";

import { getDb } from "../lib/db";
import { productos } from "../lib/schema";
import { eq, like, or, sql } from "drizzle-orm";
import { logAction } from "../lib/logger";

/** Cantidad de productos por página en listados */
export const PRODUCTS_PER_PAGE = 20;

interface InventoryState {
  /** Productos de la página actual (máximo PRODUCTS_PER_PAGE) */
  products: Producto[];
  /** Cantidad total de productos (para paginación) */
  totalCount: number;
  /** Página actual (1-indexed) */
  currentPage: number;
  /** Filtro de búsqueda activo */
  searchTerm: string;

  isLoading: boolean;
  error: string | null;
  
  // Acciones paginadas — NUNCA cargan todos los productos
  fetchProductsPage: (page?: number, search?: string) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setPage: (page: number) => void;

  // Acciones CRUD
  addProduct: (product: NewProducto) => Promise<void>;
  updateProduct: (id: number, product: Partial<Producto>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;

  /**
   * Búsqueda ligera delegada 100% a SQLite.
   * Devuelve máximo `limit` productos coincidentes (no los guarda en el store).
   * Ideal para dropdowns de autocompletado / escaneo de código de barras.
   */
  searchProductsSQL: (query: string, limit?: number) => Promise<Producto[]>;

  /**
   * Busca un producto exacto por código de barras en SQLite.
   * Ideal para pistola de código de barras (hit o miss rápido).
   */
  findByBarcode: (barcode: string) => Promise<Producto | null>;

  // Mantener retrocompatibilidad para código existente que llame a fetchProducts()
  fetchProducts: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  totalCount: 0,
  currentPage: 1,
  searchTerm: "",
  isLoading: false,
  error: null,

  fetchProductsPage: async (page?: number, search?: string) => {
    const currentState = get();
    const targetPage = page ?? currentState.currentPage;
    const targetSearch = search ?? currentState.searchTerm;
    const offset = (targetPage - 1) * PRODUCTS_PER_PAGE;

    set({ isLoading: true, error: null });
    try {
      const db = await getDb();

      let countResult: any[];
      let pageRows: any[];

      if (targetSearch.trim()) {
        const term = `%${targetSearch.trim()}%`;

        // Contar coincidencias totales (SQLite)
        countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(productos)
          .where(
            or(
              like(productos.nombre, term),
              like(productos.codigo_barras, term),
              like(productos.categoria, term)
            )
          );

        // Traer sólo la página actual (SQLite LIMIT + OFFSET)
        pageRows = await db
          .select()
          .from(productos)
          .where(
            or(
              like(productos.nombre, term),
              like(productos.codigo_barras, term),
              like(productos.categoria, term)
            )
          )
          .limit(PRODUCTS_PER_PAGE)
          .offset(offset);
      } else {
        // Sin filtro: contar todo y traer la página
        countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(productos);

        pageRows = await db
          .select()
          .from(productos)
          .limit(PRODUCTS_PER_PAGE)
          .offset(offset);
      }

      const total = Number(countResult[0]?.count ?? 0);

      set({
        products: pageRows as Producto[],
        totalCount: total,
        currentPage: targetPage,
        searchTerm: targetSearch,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setSearchTerm: (term: string) => {
    // Al cambiar la búsqueda, resetear a página 1 y refetch
    set({ searchTerm: term, currentPage: 1 });
    get().fetchProductsPage(1, term);
  },

  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchProductsPage(page);
  },

  // Retrocompatibilidad: alias que carga la primera página
  fetchProducts: async () => {
    await get().fetchProductsPage(1, "");
  },

  searchProductsSQL: async (query: string, limit = 20) => {
    if (!query.trim()) return [];
    try {
      const db = await getDb();
      const term = `%${query.trim()}%`;
      const results = await db
        .select()
        .from(productos)
        .where(
          or(
            like(productos.nombre, term),
            like(productos.codigo_barras, term),
            like(productos.categoria, term)
          )
        )
        .limit(limit);
      return results as Producto[];
    } catch (error) {
      console.error("searchProductsSQL error:", error);
      return [];
    }
  },

  findByBarcode: async (barcode: string) => {
    try {
      const db = await getDb();
      const rows = await db
        .select()
        .from(productos)
        .where(eq(productos.codigo_barras, barcode))
        .limit(1);
      return rows.length > 0 ? (rows[0] as Producto) : null;
    } catch (error) {
      console.error("findByBarcode error:", error);
      return null;
    }
  },

  addProduct: async (newProduct: NewProducto) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      await db.insert(productos).values(newProduct);
      
      await logAction(`Producto registrado exitosamente: ${newProduct.nombre} (ID Proveedor: ${newProduct.id_proveedor || "N/A"})`);
      
      // Refrescar la página actual en vez de cargar todo
      await get().fetchProductsPage();
    } catch (error) {
      const errMessage = (error as Error).message;
      set({ error: errMessage, isLoading: false });
      await logAction(`Error al registrar producto ${newProduct.nombre}: ${errMessage}`);
    }
  },

  updateProduct: async (id: number, productUpdates: Partial<Producto>) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      await db.update(productos)
        .set(productUpdates)
        .where(eq(productos.id_producto, id));

      // Actualizar solo el producto afectado localmente (si está en la página visible)
      set({ 
        products: get().products.map(p => 
          p.id_producto === id ? { ...p, ...productUpdates } : p
        ),
        isLoading: false
      });
      
      await logAction(`Producto actualizado (ID: ${id}): ${productUpdates.nombre || "Sin nombre"}`);
    } catch (error) {
      const errMessage = (error as Error).message;
      set({ error: errMessage, isLoading: false });
      await logAction(`Error al actualizar producto (ID: ${id}): ${errMessage}`);
    }
  },

  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      await db.delete(productos).where(eq(productos.id_producto, id));
      
      await logAction(`Producto eliminado (ID: ${id})`);

      // Refrescar la página actual
      await get().fetchProductsPage();
    } catch (error) {
      const errMessage = (error as Error).message;
      set({ error: errMessage, isLoading: false });
      await logAction(`Error al eliminar producto (ID: ${id}): ${errMessage}`);
    }
  }
}));
