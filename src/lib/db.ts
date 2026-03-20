import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

// @ts-ignore Permitimos chequear el entorno nativo inyectado
const isTauri = typeof window !== "undefined" && window.__TAURI_INTERNALS__ !== undefined;

class DatabaseClient {
  private static dbInstance: any;

  static async getInstance() {
    if (!this.dbInstance) {
      try {
        let tauriDb: Database | null = null;
        
        if (isTauri) {
          // Inicializa el archivo SQLite nativo vía Tauri solo si estamos en App Nativa
          const isDev = import.meta.env.DEV;
          
          if (isDev) {
            // Durante el desarrollo local, usamos una ruta absoluta hacia el proyecto 
            // para que puedas abrir el archivo .db con cualquier visor de SQLite (ej. DBeaver o extensiones de VSCode)
            tauriDb = await Database.load("sqlite:C:/Users/Franco/Documents/Proyectos-SSD/centauri-balance/src-tauri/centauri-dev.db");
            console.log("🛠️ Dev Mode: Base de datos cargada localmente en la carpeta del proyecto");
          } else {
            // En producción, se guarda en el directorio AppData del sistema operativo
            tauriDb = await Database.load("sqlite:centauri.db");
          }
        } else {
          console.warn("⚠️ Ejecutando en navegador web (Vite normal). Modo Mock DB Activado (Sin SQLite de Tauri).");
        }

        // Crea el Proxy de Drizzle vinculando las consultas
        this.dbInstance = drizzle(
          async (query: string, params: any[], method: "run" | "all" | "values" | "get") => {
            // Si estamos en navegador, usamos el Backend local de Vite configurado via Middleware
            if (!isTauri || !tauriDb) {
              try {
                const res = await fetch('/api/sqlite', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query, params, method })
                });
                if (!res.ok) {
                  const error = await res.json();
                  throw new Error(error.error || "Falla al ejecutar SQL en Vite Dev");
                }
                return await res.json();
              } catch (e) {
                console.error("Error contactando Vite dev server SQLite proxy:", e);
                return { rows: [] };
              }
            }

            let rows: any = [];

            if (method === "run") {
              try {
                await tauriDb.execute(query, params);
                return { rows: [] };
              } catch (e: any) {
                const errorStr = e.toString ? e.toString() : JSON.stringify(e);
                alert(`Error nativo de BD:\n${errorStr}\n\nQuery: ${query}`);
                throw e;
              }
            }

            if (method === "all" || method === "values" || method === "get") {
              const rawRows: any[] = await tauriDb.select(query, params) as any[];

              // drizzle-orm/sqlite-proxy espera rows como arrays de valores, no como objetos
              // tauri-plugin-sql devuelve objetos {col: val}, convertimos a [val, val, ...]
              rows = rawRows.map((row: any) => Object.values(row));
              return { rows: method === "get" ? rows.slice(0, 1) : rows };
            }

            return { rows: [] };
          },
          { schema }
        );
        
        if (isTauri) {
          console.log("DatabaseClient: Base de datos Tauri + Drizzle inicializada correctamente.");
        }
      } catch (error) {
        console.error("DatabaseClient Error: No se pudo conectar a la DB.", error);
        throw error;
      }
    }

    return this.dbInstance;
  }
}

export const getDb = () => DatabaseClient.getInstance();
