import { create } from "zustand";
import { Egreso, NewEgreso } from "../lib/schema";
import { getDb } from "../lib/db";
import { egresos, ventas } from "../lib/schema";
import { eq, sql } from "drizzle-orm";

interface CashRegisterState {
  dateRange: { start: string; end: string };
  todaySales: { total: number; count: number };
  todayExpenses: { total: number; count: number };
  expenses: Egreso[];
  isLoading: boolean;
  error: string | null;

  setDateRange: (start: string, end: string) => void;
  fetchTodaySummary: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: NewEgreso) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

/** Devuelve un rango por defecto (Hoy 00:00. a Mañana 04:00 por ejemplo, o solo Hoy) */
function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Transformar local a ISO para input datetime-local truncando segundos (YYYY-MM-DDTHH:mm)
  const formatForInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return { start: formatForInput(start), end: formatForInput(end) };
}

export const useCashRegisterStore = create<CashRegisterState>((set, get) => ({
  dateRange: getDefaultRange(),
  todaySales: { total: 0, count: 0 },
  todayExpenses: { total: 0, count: 0 },
  expenses: [],
  isLoading: false,
  error: null,

  setDateRange: (start: string, end: string) => {
    set({ dateRange: { start, end } });
  },

  fetchTodaySummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const { start, end } = get().dateRange;
      const startSql = start.replace("T", " ") + ":00";
      const endSql = end.replace("T", " ") + ":59";

      // Sumar ventas del día
      const salesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${ventas.precio} * ${ventas.cantidad}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(ventas)
        .where(sql`datetime(${ventas.fecha}) >= datetime(${startSql}) AND datetime(${ventas.fecha}) <= datetime(${endSql})`);

      const salesRow = salesResult[0] || { total: 0, count: 0 };

      // Sumar egresos del día
      const expensesResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${egresos.monto}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(egresos)
        .where(sql`datetime(${egresos.fecha}) >= datetime(${startSql}) AND datetime(${egresos.fecha}) <= datetime(${endSql})`);

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
      const { start, end } = get().dateRange;
      const startSql = start.replace("T", " ") + ":00";
      const endSql = end.replace("T", " ") + ":59";

      const allExpenses = await db
        .select()
        .from(egresos)
        .where(sql`datetime(${egresos.fecha}) >= datetime(${startSql}) AND datetime(${egresos.fecha}) <= datetime(${endSql})`);
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
