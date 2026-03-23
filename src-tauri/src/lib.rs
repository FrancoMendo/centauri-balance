// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_egresos",
            sql: "CREATE TABLE IF NOT EXISTS `egresos` (
                    `id_egreso` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `descripcion` text NOT NULL,
                    `monto` real NOT NULL,
                    `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                    `id_usuario` integer NOT NULL
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_logs",
            sql: "CREATE TABLE IF NOT EXISTS `logs` (
                    `id_log` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `descripcion` text NOT NULL,
                    `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                    `id_usuario` integer
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_productos",
            sql: "CREATE TABLE IF NOT EXISTS `productos` (
                    `id_producto` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `nombre` text NOT NULL,
                    `categoria` text,
                    `precio` real NOT NULL,
                    `stock` integer DEFAULT 0 NOT NULL,
                    `codigo_barras` text,
                    `descripcion` text,
                    `id_proveedor` integer
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_index_productos",
            sql: "CREATE UNIQUE INDEX IF NOT EXISTS `productos_codigo_barras_unique` ON `productos` (`codigo_barras`);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_proveedores",
            sql: "CREATE TABLE IF NOT EXISTS `proveedores` (
                    `id_proveedor` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `nombre` text NOT NULL,
                    `telefono` text,
                    `direccion` text,
                    `email` text
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_usuarios",
            sql: "CREATE TABLE IF NOT EXISTS `usuarios` (
                    `id_usuario` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `nombre` text NOT NULL,
                    `password` text NOT NULL,
                    `rol` text DEFAULT 'user' NOT NULL
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_ventas",
            sql: "CREATE TABLE IF NOT EXISTS `ventas` (
                    `id_venta` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `id_producto` integer NOT NULL,
                    `cantidad` integer NOT NULL,
                    `precio` real NOT NULL,
                    `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                    `id_usuario` integer NOT NULL
                );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "sync_drizzle_schema_updates",
            sql: "
                CREATE TABLE IF NOT EXISTS `metodos_pago` (
                    `id_metodo` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `nombre` text NOT NULL,
                    `comision_porcentaje` real DEFAULT 0 NOT NULL
                );
                
                ALTER TABLE `productos` ADD COLUMN `precio_lista` real DEFAULT 0 NOT NULL;
                ALTER TABLE `productos` RENAME COLUMN `precio` TO `precio_venta`;
                
                ALTER TABLE `ventas` RENAME COLUMN `precio` TO `precio_venta`;
                ALTER TABLE `ventas` ADD COLUMN `id_operacion` text DEFAULT '' NOT NULL;
                ALTER TABLE `ventas` ADD COLUMN `metodo_pago` text DEFAULT 'Efectivo' NOT NULL;
                ALTER TABLE `ventas` ADD COLUMN `comision_porcentaje` real DEFAULT 0 NOT NULL;
                
                ALTER TABLE `egresos` ADD COLUMN `categoria` text DEFAULT 'Otros' NOT NULL;
                ALTER TABLE `egresos` ADD COLUMN `metodo_pago` text DEFAULT 'Efectivo' NOT NULL;
                ALTER TABLE `egresos` ADD COLUMN `id_proveedor` integer;
                
                INSERT OR IGNORE INTO `usuarios` (`id_usuario`, `nombre`, `password`, `rol`) VALUES (1, 'Administrador Central', '1234', 'admin');
                
                INSERT OR IGNORE INTO `metodos_pago` (`nombre`, `comision_porcentaje`) VALUES ('Efectivo', 0), ('Tarjeta Débito', 3), ('Tarjeta Crédito', 8), ('QR Mercado Pago', 15);
            ",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:centauri.db", migrations)
            .build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
