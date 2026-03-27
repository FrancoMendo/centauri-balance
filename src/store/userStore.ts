import { create } from "zustand";
import { Usuario, usuarios } from "../lib/schema";
import { getDb } from "../lib/db";
import { eq } from "drizzle-orm";
import { Database } from "./types";

interface LogsState {
  currentUser: Usuario | null;
  isLoading: boolean;
  error: string | null;

  setError: (error: string | null) => void;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<LogsState>((set, get) => ({
  isLoading: false,
  error: null,
  currentUser: null,

  setError: (error: string | null) => set({ error }),

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const db: Database = await getDb();
      const users = await db.select().from(usuarios).where(eq(usuarios.nombre, username));
      const user = users[0];
      if (!user) {
        set({ error: "Usuario no encontrado", isLoading: false });
        return;
      }
      if (user.password !== password) {
        set({ error: `Contraseña incorrecta`, isLoading: false });
        return;
      }
      set({ currentUser: user, isLoading: false });
    } catch (error) {
      const errMessage = (error as Error).message;
      set({ error: errMessage, isLoading: false });
    }
  },

  logout: () => {
    set({ currentUser: null });
  },
}));