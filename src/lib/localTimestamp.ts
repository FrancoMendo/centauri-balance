/**
 * Genera un timestamp local en formato ISO-like para SQLite: "YYYY-MM-DD HH:MM:SS"
 * Usa la hora del sistema operativo (Argentina UTC-3 en este caso),
 * evitando que SQLite devuelva UTC+0 con CURRENT_TIMESTAMP.
 */
export function localTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
