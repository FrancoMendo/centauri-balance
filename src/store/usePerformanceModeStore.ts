import { create } from "zustand";

const STORAGE_KEY = "performance_mode_enabled";

interface PerformanceModeState {
  /** Modo bajos recursos: búsqueda de productos resuelta contra un caché en
   * memoria en vez de consultar SQLite en cada tecla, y estilos livianos
   * (sin sombras/blur/bordes redondeados costosos de repintar) para equipos
   * sin aceleración de GPU donde WebKitGTK renderiza por software. Pensado
   * para equipos de pocos núcleos (ej. Debian de bajos recursos). */
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

// Sincroniza `perf-mode` en <html> para que App.css pueda desactivar por CSS
// los efectos más costosos de repintar bajo software rendering, sin pasar
// props por cada componente.
document.documentElement.classList.toggle(
  "perf-mode",
  usePerformanceModeStore.getState().enabled
);
usePerformanceModeStore.subscribe((state) => {
  document.documentElement.classList.toggle("perf-mode", state.enabled);
});
