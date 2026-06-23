# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos principales

```bash
# Desarrollo completo (Tauri + React — requiere Rust instalado)
npm run tauri dev

# Desarrollo solo en navegador (sin Tauri, SQLite via middleware Vite)
npm run dev

# Compilar instalador (.exe/.msi/.deb)
npm run build:exe

# Generar nueva migración Drizzle a partir de cambios en schema.ts
npm run generate-migration

# Aplicar migraciones al archivo SQLite de desarrollo local
npm run migrate:localhost

# Abrir UI visual de la BD (Drizzle Studio)
npm run db:studio

# Poblar la BD de desarrollo con datos de prueba
npm run db:seed
```

## Arquitectura general

**Centauri Balance** es un POS (punto de venta) de escritorio offline-first construido con:
- **Tauri v2** (shell nativo en Rust) + **React 19** + **TypeScript** + **Vite**
- **SQLite embebido** accedido via `@tauri-apps/plugin-sql`
- **Drizzle ORM** como query builder fuertemente tipado (proxy sobre SQLite)
- **Zustand** para estado global del cliente

### Flujo de datos

```
UI (React) → Zustand Store → Drizzle ORM → DatabaseClient (proxy) → SQLite nativo (Tauri)
```

En desarrollo con navegador puro (`npm run dev`), el `DatabaseClient` redirige las queries al middleware `/api/sqlite` del servidor Vite, que usa `better-sqlite3` para acceder al mismo archivo `src-tauri/centauri-dev.db`.

### Archivos clave

| Archivo | Rol |
|---|---|
| `src/lib/db.ts` | Singleton `DatabaseClient` — detecta si corre en Tauri o en browser y enruta queries apropiadamente |
| `src/lib/schema.ts` | Definición de tablas Drizzle (fuente de verdad de tipos TypeScript) |
| `src/lib/navigation.ts` | Tipos de páginas y función `canAccessPage()` para control de acceso por rol |
| `src/lib/logger.ts` | `logAction()` — escribe en tabla `logs` para auditoría |
| `src/lib/localTimestamp.ts` | `localTimestamp()` — genera timestamps en hora local (nunca usar `datetime('now')` de SQLite) |
| `src-tauri/src/lib.rs` | Setup de Tauri: registra migraciones SQL embebidas directamente en el binario |
| `vite.config.ts` | Plugin `sqliteDevPlugin` — middleware `/api/sqlite` para desarrollo en browser |

### Stores Zustand

- `useInventoryStore` — CRUD de productos con paginación y búsqueda delegada a SQLite
- `useSalesStore` — Carrito temporal de venta (estado en memoria, no persistido)
- `useCashRegisterStore` — Resumen y egresos del turno actual; usa `initDateRange()` para calcular el rango según el horario comercial
- `useLogsStore` — Lectura de logs de auditoría
- `userStore` — Usuario autenticado actualmente

### Routing y acceso por roles

No hay React Router. La navegación es por estado (`currentPage: PageView`) en `App.tsx`. Los roles son:
- `admin`: acceso total a todas las páginas
- `user` / `operador`: solo `sales`, `sales_history`, `inventory`, `bulk_edit`

### Sistema de licencias

El hook `useLicense` valida al inicio una fila en la tabla `parametros` con `key = 'product_key'`. Para activar manualmente en la BD:

```sql
INSERT INTO parametros (key, value, date)
VALUES ('product_key', 'Centauri-8898-Secure', 'DD-MM-YYYY HH:mm');
```

El formato de fecha es `DD-MM-YYYY HH:mm`. Pasados 5 días de gracia tras la expiración, el registro se elimina y la app queda bloqueada.

### Migraciones — doble registro obligatorio

Cuando se agrega una tabla o columna nueva hay que actualizar **dos lugares**:
1. `src/lib/schema.ts` — definición Drizzle (para TypeScript y `drizzle-kit generate`)
2. `src-tauri/src/lib.rs` — nuevo `Migration { version: N, ... }` en el vector `migrations` (aplicado en runtime por Tauri)

Los archivos en `src-tauri/migrations/` son generados por `drizzle-kit generate` y solo se usan para `migrate:localhost` (BD de desarrollo local), no en producción.

### Timestamps y zona horaria

Siempre usar `localTimestamp()` de `src/lib/localTimestamp.ts` al insertar fechas. SQLite's `CURRENT_TIMESTAMP` devuelve UTC y rompe los filtros por rango de fechas que usan hora local Argentina (UTC-3).

### Horario comercial

Guardado como JSON en `parametros` bajo `key = 'business_hours'`. El hook `useBusinessHours` y la función `getBusinessDateRange()` calculan el rango inicio/fin del turno actual, soportando turnos que cruzan la medianoche.
