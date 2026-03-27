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
            sql: "CREATE TABLE `egresos` (
                `id_egreso` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                `descripcion` text NOT NULL,
                `categoria` text DEFAULT 'Otros' NOT NULL,
                `monto` real NOT NULL,
                `metodo_pago` text DEFAULT 'Efectivo' NOT NULL,
                `id_proveedor` integer,
                `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                `id_usuario` integer NOT NULL,
                FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_logs",
            sql: "CREATE TABLE `logs` (
                `id_log` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                `descripcion` text NOT NULL,
                `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                `id_usuario` integer,
                FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_metodos_pago",
            sql: "CREATE TABLE `metodos_pago` (
                `id_metodo` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                `nombre` text NOT NULL,
                `comision_porcentaje` real DEFAULT 0 NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_productos",
            sql: "CREATE TABLE `productos` (
                `id_producto` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                `nombre` text NOT NULL,
                `categoria` text,
                `precio_lista` real DEFAULT 0 NOT NULL,
                `precio_venta` real NOT NULL,
                `stock` integer DEFAULT 0 NOT NULL,
                `codigo_barras` text,
                `descripcion` text,
                `id_proveedor` integer,
                FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON UPDATE no action ON DELETE no action
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_index_productos",
            sql: "CREATE UNIQUE INDEX IF NOT EXISTS `productos_codigo_barras_unique` ON `productos` (`codigo_barras`);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
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
            version: 7,
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
            version: 8,
            description: "create_ventas",
            sql: "CREATE TABLE `ventas` (
                `id_venta` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                `id_operacion` text DEFAULT '' NOT NULL,
                `id_producto` integer NOT NULL,
                `cantidad` integer NOT NULL,
                `precio_venta` real NOT NULL,
                `metodo_pago` text DEFAULT 'Efectivo' NOT NULL,
                `comision_porcentaje` real DEFAULT 0 NOT NULL,
                `fecha` text DEFAULT (CURRENT_TIMESTAMP),
                `id_usuario` integer NOT NULL,
                FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON UPDATE no action ON DELETE no action,
                FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "seed_productos_inicial",
            sql: include_str!("../../productos.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "seed_usuarios_inicial",
            sql: "INSERT OR IGNORE INTO usuarios (id_usuario, nombre, password, rol) VALUES (1, 'admin', '1234', 'admin'), (2, 'operador', '', 'user');",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:centauri.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
