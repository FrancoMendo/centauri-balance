import { useState, useEffect } from "react";
import { Clock, Save, Sun, Moon, ArrowRight, Info } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { useBusinessHours, getBusinessDateRange, type BusinessHours } from "../hooks/useBusinessHours";

export function BusinessHoursSettings() {
  const { hours, isLoading, isSaving, error, saveHours } = useBusinessHours();

  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("23:59");
  const [crossesMidnight, setCrossesMidnight] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincronizar formulario local con datos de la BD
  useEffect(() => {
    if (!isLoading) {
      setOpenTime(hours.openTime);
      setCloseTime(hours.closeTime);
      setCrossesMidnight(hours.crossesMidnight);
    }
  }, [isLoading, hours]);

  // Calcular el rango de vista previa
  const previewRange = getBusinessDateRange({ openTime, closeTime, crossesMidnight });
  const previewStart = new Date(previewRange.start).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const previewEnd = new Date(previewRange.end).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newHours: BusinessHours = { openTime, closeTime, crossesMidnight };
    await saveHours(newHours);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-violet-600 to-purple-600 flex items-center gap-3">
          <Clock className="w-8 h-8 text-violet-600" />
          Configuración de Horario
        </h1>
        <p className="text-gray-500 mt-1">
          Defina el horario operativo del negocio. Esto establece los filtros de fecha por defecto en Cierre de Caja, Historial de Ventas y otros reportes.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
          
          {/* Hora de Apertura y Cierre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="openTime" className="flex items-center gap-2 text-base">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Sun className="w-4 h-4" />
                </div>
                Hora de Apertura
              </Label>
              <input
                id="openTime"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-xl font-mono font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all shadow-sm"
              />
              <p className="text-xs text-gray-400">
                Hora a la que comienza la jornada operativa.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="closeTime" className="flex items-center gap-2 text-base">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Moon className="w-4 h-4" />
                </div>
                Hora de Cierre
              </Label>
              <input
                id="closeTime"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-xl font-mono font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all shadow-sm"
              />
              <p className="text-xs text-gray-400">
                Hora a la que finaliza la jornada operativa.
              </p>
            </div>
          </div>

          {/* Toggle Cruza Medianoche */}
          <div className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100">
            <label className="relative inline-flex items-center cursor-pointer mt-0.5">
              <input
                type="checkbox"
                checked={crossesMidnight}
                onChange={(e) => setCrossesMidnight(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-violet-300/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-violet-600 transition-colors" />
            </label>
            <div>
              <span className="font-semibold text-gray-800 text-sm">
                El cierre cruza la medianoche
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Active esta opción si el negocio cierra después de las 00:00. Por ejemplo, si abre a las 8:00 y cierra a las 4:00 AM del día siguiente.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Botón Guardar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Los cambios se aplicarán inmediatamente a los filtros de fecha por defecto.
            </p>
            <Button type="submit" disabled={isSaving} className="px-8">
              <Save className="w-4 h-4" />
              {isSaving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar Configuración"}
            </Button>
          </div>
        </form>

        {/* Panel de Vista Previa */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Info className="w-4 h-4 text-violet-500" />
              Vista Previa del Día Operativo
            </h3>

            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-5 border border-violet-100">
              <div className="flex items-center gap-3 justify-center">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-violet-400 mb-1">Desde</p>
                  <p className="text-sm font-semibold text-gray-800 bg-white px-3 py-2 rounded-lg border border-violet-200 shadow-sm">
                    {previewStart}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-violet-400 mt-4 shrink-0" />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-violet-400 mb-1">Hasta</p>
                  <p className="text-sm font-semibold text-gray-800 bg-white px-3 py-2 rounded-lg border border-violet-200 shadow-sm">
                    {previewEnd}
                  </p>
                </div>
              </div>
              {crossesMidnight && (
                <p className="text-center mt-4 text-xs text-violet-600 bg-violet-100 rounded-lg px-3 py-2 font-medium">
                  🌙 La jornada cruza la medianoche — el cierre corresponde al día siguiente.
                </p>
              )}
            </div>
          </div>

          {/* Ejemplos rápidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuraciones rápidas</h4>
            {[
              { label: "Comercio diurno", open: "08:00", close: "20:00", midnight: false },
              { label: "Kiosco 24hs", open: "06:00", close: "06:00", midnight: true },
              { label: "Negocio nocturno", open: "18:00", close: "04:00", midnight: true },
              { label: "Supermercado", open: "08:00", close: "22:00", midnight: false },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setOpenTime(preset.open);
                  setCloseTime(preset.close);
                  setCrossesMidnight(preset.midnight);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all text-sm group"
              >
                <span className="font-medium text-gray-700 group-hover:text-violet-700">
                  {preset.label}
                </span>
                <span className="text-xs font-mono text-gray-400 group-hover:text-violet-500">
                  {preset.open} – {preset.close} {preset.midnight ? "🌙" : "☀️"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
