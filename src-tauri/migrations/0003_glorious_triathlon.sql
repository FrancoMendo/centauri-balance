PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_egresos` (
	`id_egreso` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`descripcion` text NOT NULL,
	`categoria` text DEFAULT 'Otros' NOT NULL,
	`monto` real NOT NULL,
	`metodo_pago` text DEFAULT 'Efectivo' NOT NULL,
	`id_proveedor` integer,
	`fecha` text DEFAULT (datetime('now','localtime')),
	`id_usuario` integer NOT NULL,
	FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores`(`id_proveedor`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_egresos`("id_egreso", "descripcion", "categoria", "monto", "metodo_pago", "id_proveedor", "fecha", "id_usuario") SELECT "id_egreso", "descripcion", "categoria", "monto", "metodo_pago", "id_proveedor", "fecha", "id_usuario" FROM `egresos`;--> statement-breakpoint
DROP TABLE `egresos`;--> statement-breakpoint
ALTER TABLE `__new_egresos` RENAME TO `egresos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_logs` (
	`id_log` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`descripcion` text NOT NULL,
	`fecha` text DEFAULT (datetime('now','localtime')),
	`id_usuario` integer,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_logs`("id_log", "descripcion", "fecha", "id_usuario") SELECT "id_log", "descripcion", "fecha", "id_usuario" FROM `logs`;--> statement-breakpoint
DROP TABLE `logs`;--> statement-breakpoint
ALTER TABLE `__new_logs` RENAME TO `logs`;--> statement-breakpoint
CREATE TABLE `__new_ventas` (
	`id_venta` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id_operacion` text DEFAULT '' NOT NULL,
	`id_producto` integer NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_venta` real NOT NULL,
	`metodo_pago` text DEFAULT 'Efectivo' NOT NULL,
	`comision_porcentaje` real DEFAULT 0 NOT NULL,
	`fecha` text DEFAULT (datetime('now','localtime')),
	`id_usuario` integer NOT NULL,
	FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ventas`("id_venta", "id_operacion", "id_producto", "cantidad", "precio_venta", "metodo_pago", "comision_porcentaje", "fecha", "id_usuario") SELECT "id_venta", "id_operacion", "id_producto", "cantidad", "precio_venta", "metodo_pago", "comision_porcentaje", "fecha", "id_usuario" FROM `ventas`;--> statement-breakpoint
DROP TABLE `ventas`;--> statement-breakpoint
ALTER TABLE `__new_ventas` RENAME TO `ventas`;