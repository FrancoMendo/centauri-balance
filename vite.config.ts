import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import Database from "better-sqlite3";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

function sqliteDevPlugin(): Plugin {
  return {
    name: 'sqlite-dev-server',
    configureServer(server) {
      // Conecta o recrea el archivo DB físico usado en tauri-dev para los testing 
      const dbPath = path.resolve("src-tauri", "centauri-dev.db");
      let db: any = null;
      try {
        db = new Database(dbPath);
      } catch (e) {
        console.error("Vite: No se pudo cargar la DB local", e);
      }

      server.middlewares.use('/api/sqlite', (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              if (!db) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "DB not initialized" }));
                return;
              }
              const { query, params, method } = JSON.parse(body);
              
              if (method === 'run') {
                const stmt = db.prepare(query);
                stmt.run(...params);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ rows: [] }));
              } else if (method === 'all' || method === 'values' || method === 'get') {
                const stmt = db.prepare(query);
                const rawRows = stmt.all(...params);
                
                // drizzle-orm/sqlite-proxy espera rows como arrays de valores, no como objetos
                // Ej: [[1, "Coca", "Bebida", 100, 10, ...], [2, ...]]
                const rows = rawRows.map((r: any) => Object.values(r));
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ rows: method === 'get' ? rows.slice(0, 1) : rows }));
              }
            } catch (err: any) {
               console.error("SQL Error en Servidor DEV Vite:", err);
               res.statusCode = 500;
               res.setHeader('Content-Type', 'application/json');
               res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), sqliteDevPlugin()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
