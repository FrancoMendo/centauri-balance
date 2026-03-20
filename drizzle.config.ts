import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./src-tauri/migrations",
  dialect: "sqlite",
  dbCredentials: {
    // Archivo SQLite local usado por Drizzle Kit para correr las migraciones en desarrollo
    url: "./src-tauri/centauri-dev.db",
  },
});
