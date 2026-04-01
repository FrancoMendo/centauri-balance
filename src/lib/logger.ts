import { getDb } from "./db";
import { logs } from "./schema";
import { localTimestamp } from "./localTimestamp";

/**
 * Registra una acción o un error en la base de datos local para fines de auditoría cruzada.
 */
export async function logAction(descripcion: string, id_usuario: number = 1): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(logs).values({
      descripcion,
      fecha: localTimestamp(),
      id_usuario
    });
  } catch (err) {
    console.error("Error crítico: el sistema de logs (Auditoría) falló al escribir en base de datos.", err);
  }
}
