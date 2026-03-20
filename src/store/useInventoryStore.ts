import { create } from "zustand";
import { Producto, NewProducto } from "../lib/schema";

import { getDb } from "../lib/db";
import { productos } from "../lib/schema";
import { eq } from "drizzle-orm";

interface InventoryState {
  products: Producto[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  fetchProducts: () => Promise<void>;
  addProduct: (product: NewProducto) => Promise<void>;
  updateProduct: (id: number, product: Partial<Producto>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const realProducts = await db.select().from(productos);
      
      set({ products: realProducts as Producto[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addProduct: async (newProduct: NewProducto) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      // Insert in SQLite via Drizzle + Tauri SQL
      await db.insert(productos).values(newProduct);
      
      // Fetch latest products state after addition (or manually update state context)
      const updatedProducts = await db.select().from(productos);
      set({ products: updatedProducts as Producto[], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProduct: async (id: number, productUpdates: Partial<Producto>) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      // Update in SQLite
      await db.update(productos)
        .set(productUpdates)
        .where(eq(productos.id_producto, id));
        
      set({ 
        products: get().products.map(p => 
          p.id_producto === id ? { ...p, ...productUpdates } : p
        ),
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      // Drizzle Delete call
      await db.delete(productos).where(eq(productos.id_producto, id));
      
      set({ 
        products: get().products.filter(p => p.id_producto !== id),
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));
