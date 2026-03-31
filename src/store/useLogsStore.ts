import { create } from "zustand";
import { Log } from "../lib/schema";
import { getDb } from "../lib/db";
import { logs } from "../lib/schema";
import { count, desc } from "drizzle-orm";
import { Database } from "./types";

interface LogsState {
  logs: Log[];
  totalCountLogs: number;
  isLoading: boolean;
  error: string | null;

  getLogs: (limit: number, offset: number) => Promise<void>;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  totalCountLogs: 0,
  isLoading: false,
  error: null,

  getLogs: async (limit: number = 20, offset: number = 0) => {
    set({ isLoading: true, error: null });
    try {
      const db: Database = await getDb();
      const allLogs = await db.select().from(logs).orderBy(desc(logs.fecha)).limit(limit).offset(offset);
      const countLogs = await db.select({ count: count(logs.id_log) }).from(logs);
      set({ logs: allLogs as Log[], totalCountLogs: Number(countLogs[0].count), isLoading: false });
    } catch (error) {
      const errMessage = (error as Error).message;
      set({ error: errMessage, isLoading: false });
    }
  },
}));