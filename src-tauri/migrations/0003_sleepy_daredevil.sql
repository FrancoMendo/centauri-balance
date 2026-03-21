ALTER TABLE `ventas` RENAME COLUMN "precio" TO "precio_venta";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_productos` (
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
);
--> statement-breakpoint
INSERT INTO `__new_productos`("id_producto", "nombre", "categoria", "precio_lista", "precio_venta", "stock", "codigo_barras", "descripcion", "id_proveedor") SELECT "id_producto", "nombre", "categoria", "precio_lista", "precio_venta", "stock", "codigo_barras", "descripcion", "id_proveedor" FROM `productos`;--> statement-breakpoint
DROP TABLE `productos`;--> statement-breakpoint
ALTER TABLE `__new_productos` RENAME TO `productos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_barras_unique` ON `productos` (`codigo_barras`);