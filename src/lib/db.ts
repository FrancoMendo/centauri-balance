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
            // Si estmos en navegador, simulamos un retorno vacío para no romper Drizzle
            if (!isTauri || !tauriDb) {
              console.log("Mock Query Ejecutada:", query, params);
              return { rows: [] };
            }

            let rows: any = [];

            if (method === "run") {
              await tauriDb.execute(query, params);
              return { rows: [] };
            }

            if (method === "all" || method === "values" || method === "get") {
              rows = await tauriDb.select(query, params);

              if (method === "values") {
                rows = rows.map((row: any) => Object.values(row));
              }
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
