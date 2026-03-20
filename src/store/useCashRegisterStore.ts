import { create } from "zustand";
import { Egreso, NewEgreso } from "../lib/schema";
import { getDb } from "../lib/db";
import { egresos, ventas } from "../lib/schema";
import { eq, sql } from "drizzle-orm";

interface CashRegisterState {
  todaySales: { total: number; count: number };
  todayExpenses: { total: number; count: number };
  expenses: Egreso[];
  isLoading: boolean;
  error: string | null;

  fetchTodaySummary: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: NewEgreso) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

/** Devuelve la fecha de hoy en formato YYYY-MM-DD */
function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const useCashRegisterStore = create<CashRegisterState>((set, get) => ({
  todaySales: { total: 0, count: 0 },
  todayExpenses: { total: 0, count: 0 },
  expenses: [],
  isLoading: false,
  error: null,

  fetchTodaySummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const today = getTodayDate();

      // Sumar ventas del día
      const salesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ventas.precio} * ${ventas.cantidad}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(ventas)
        .where(sql`date(${ventas.fecha}) = ${today}`);

      const salesRow = salesResult[0] || { total: 0, count: 0 };

      // Sumar egresos del día
      const expensesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${egresos.monto}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(egresos)
        .where(sql`date(${egresos.fecha}) = ${today}`);

      const expRow = expensesResult[0] || { total: 0, count: 0 };

      set({
        todaySales: { total: Number(salesRow.total), count: Number(salesRow.count) },
        todayExpenses: { total: Number(expRow.total), count: Number(expRow.count) },
        isLoading: false,
      });
    } catch (error) {
      console.error("Error al obtener resumen:", error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchExpenses: async () => {
    try {
      const db = await getDb();
      const today = getTodayDate();
      const allExpenses = await db
        .select()
        .from(egresos)
        .where(sql`date(${egresos.fecha}) = ${today}`);
      set({ expenses: allExpenses as Egreso[] });
    } catch (error) {
      console.error("Error al obtener egresos:", error);
    }
  },

  addExpense: async (newExpense: NewEgreso) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      await db.insert(egresos).values(newExpense);
      // Refrescar
      await get().fetchExpenses();
      await get().fetchTodaySummary();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteExpense: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      await db.delete(egresos).where(eq(egresos.id_egreso, id));
      await get().fetchExpenses();
      await get().fetchTodaySummary();
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
