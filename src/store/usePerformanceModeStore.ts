import { create } from "zustand";

const STORAGE_KEY = "performance_mode_enabled";

interface PerformanceModeState {
  /** Modo bajos recursos: búsqueda de productos resuelta contra un caché en
   * memoria en vez de consultar SQLite en cada tecla. Pensado para equipos
   * de pocos núcleos (ej. Debian de bajos recursos) donde el roundtrip IPC +
   * scan de SQLite en cada búsqueda se nota como lentitud en el buscador. */
  enabled: boolean;
  toggle: () => void;
}

export const usePerformanceModeStore = create<PerformanceModeState>((set) => ({
  enabled: localStorage.getItem(STORAGE_KEY) === "true",
  toggle: () =>
    set((state) => {
      const next = !state.enabled;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { enabled: next };
    }),
}));
