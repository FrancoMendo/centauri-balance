import { useState, useEffect } from "react";
import { getDb } from "../lib/db";
import { eq } from "drizzle-orm";
import { parametros } from "../lib/schema";

export type LicenseStatus = "active" | "expired_grace" | "blocked" | "loading";

const EXPECTED_HASH = "Centauri-8898-Secure";
/*
  GUIA DE ACTIVACION MANUAL:
  INSERT INTO parametros (`key`, `value`, `date`) 
  VALUES ('product_key', 'Centauri-8898-Secure', '20-04-2026 12:00');
*/

export function useLicense() {
  const [status, setStatus] = useState<LicenseStatus>("loading");
  const [expirationDate, setExpirationDate] = useState<string | null>(null);

  useEffect(() => {
    async function checkLicense() {
      try {
        const db = await getDb();
        const result = await db.select().from(parametros).where(eq(parametros.key, "product_key")).limit(1);

        if (result.length === 0) {
          // Si no existe el registro, se bloquea el acceso
          setStatus("blocked");
          return;
        }

        const param = result[0];
        setExpirationDate(param.date);

        // Validacion de Hash
        if (param.value !== EXPECTED_HASH) {
          setStatus("blocked");
          return;
        }

        // Parse format DD-MM-YYYY HH:mm
        const [day, month, year, time] = param.date.split(/[- ]/);
        const [hour, min] = time.split(':');
        const expiration = new Date(+year, +month - 1, +day, +hour, +min);
        
        const now = new Date();
        const gracePeriodMs = 5 * 24 * 60 * 60 * 1000;
        const graceEnd = new Date(expiration.getTime() + gracePeriodMs);

        if (now > graceEnd) {
          // Una vez superado el periodo de gracia, borramos el registro y bloqueamos
          await db.delete(parametros).where(eq(parametros.key, "product_key"));
          setStatus("blocked");
        } else if (now > expiration) {
          setStatus("expired_grace");
        } else {
          setStatus("active");
        }
      } catch (error) {
        console.error("Error checking license:", error);
        // En caso de error técnico real (no falta de key), permitimos temporalmente
        setStatus("active"); 
      }
    }


    checkLicense();
    // Check every hour
    const interval = setInterval(checkLicense, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { status, expirationDate };
}
