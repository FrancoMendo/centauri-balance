import { useState, useEffect, useCallback } from "react";
import { getDb } from "../lib/db";
import { parametros } from "../lib/schema";
import { eq } from "drizzle-orm";

/**
 * Configuración de horario comercial del negocio.
 * - openTime: hora de apertura (ej: "08:00")
 * - closeTime: hora de cierre (ej: "04:00" del día siguiente)
 * - crossesMidnight: indica si el cierre cruza medianoche (ej: abre 8am cierra 4am → true)
 */
export interface BusinessHours {
  openTime: string;   // "HH:mm"
  closeTime: string;  // "HH:mm"
  crossesMidnight: boolean;
}

const PARAM_KEY = "business_hours";

/** Valores por defecto si no hay configuración guardada */
const DEFAULT_HOURS: BusinessHours = {
  openTime: "08:00",
  closeTime: "23:59",
  crossesMidnight: false,
};

/**
 * Hook para leer y escribir la configuración de horario comercial.
 * Almacena la configuración como JSON en la tabla `parametros`.
 */
export function useBusinessHours() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = await getDb();
      const result = await db
        .select()
        .from(parametros)
        .where(eq(parametros.key, PARAM_KEY))
        .limit(1);

      if (result.length > 0) {
        const parsed = JSON.parse(result[0].value) as BusinessHours;
        setHours(parsed);
      }
    } catch (err) {
      console.error("Error al cargar horario comercial:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const saveHours = async (newHours: BusinessHours) => {
    setIsSaving(true);
    setError(null);
    try {
      const db = await getDb();
      const existing = await db
        .select()
        .from(parametros)
        .where(eq(parametros.key, PARAM_KEY))
        .limit(1);

      const jsonValue = JSON.stringify(newHours);

      if (existing.length > 0) {
        await db
          .update(parametros)
          .set({ value: jsonValue })
          .where(eq(parametros.key, PARAM_KEY));
      } else {
        await db.insert(parametros).values({
          key: PARAM_KEY,
          value: jsonValue,
          date: new Date().toISOString().slice(0, 10),
        });
      }

      setHours(newHours);
    } catch (err) {
      const msg = (err as Error).message;
      console.error("Error al guardar horario comercial:", err);
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return { hours, isLoading, isSaving, error, saveHours, refetch: fetchHours };
}

/**
 * Calcula el rango de fechas "Desde–Hasta" para el día operativo actual
 * basándose en la configuración de horario comercial.
 *
 * Ejemplo: Apertura 08:00, Cierre 04:00 (cruza medianoche)
 *   → Si ahora son las 10:00 del 31/03: Desde 31/03 08:00 → Hasta 01/04 04:00
 *   → Si ahora son las 02:00 del 01/04: Desde 31/03 08:00 → Hasta 01/04 04:00 (sigue siendo el mismo turno)
 */
export function getBusinessDateRange(hours: BusinessHours): { start: string; end: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");

  const [openH, openM] = hours.openTime.split(":").map(Number);
  const [closeH, closeM] = hours.closeTime.split(":").map(Number);

  let startDate: Date;
  let endDate: Date;

  if (hours.crossesMidnight) {
    // Determinar si estamos en la parte "después de medianoche" del turno anterior
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const closeMinutes = closeH * 60 + closeM;
    const openMinutes = openH * 60 + openM;

    if (nowMinutes < closeMinutes && nowMinutes < openMinutes) {
      // Estamos en la madrugada (ej: 2am) → el turno empezó ayer
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(openH, openM, 0, 0);

      endDate = new Date(now);
      endDate.setHours(closeH, closeM, 0, 0);
    } else {
      // Estamos después de la apertura (ej: 10am) → el turno cierra mañana
      startDate = new Date(now);
      startDate.setHours(openH, openM, 0, 0);

      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(closeH, closeM, 0, 0);
    }
  } else {
    // No cruza medianoche → misma fecha
    startDate = new Date(now);
    startDate.setHours(openH, openM, 0, 0);

    endDate = new Date(now);
    endDate.setHours(closeH, closeM, 0, 0);
  }

  const formatForInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return { start: formatForInput(startDate), end: formatForInput(endDate) };
}

/**
 * Lee la configuración de horario directamente desde la BD (sin hook React).
 * Útil para stores de Zustand y funciones no-React.
 */
export async function fetchBusinessHoursFromDB(): Promise<BusinessHours> {
  try {
    const db = await getDb();
    const result = await db
      .select()
      .from(parametros)
      .where(eq(parametros.key, PARAM_KEY))
      .limit(1);

    if (result.length > 0) {
      return JSON.parse(result[0].value) as BusinessHours;
    }
  } catch (err) {
    console.error("Error al leer horario comercial:", err);
  }
  return DEFAULT_HOURS;
}
