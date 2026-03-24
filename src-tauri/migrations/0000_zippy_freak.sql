CREATE TABLE `egresos` (
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
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id_log` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`descripcion` text NOT NULL,
	`fecha` text DEFAULT (CURRENT_TIMESTAMP),
	`id_usuario` integer,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metodos_pago` (
	`id_metodo` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`comision_porcentaje` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `productos` (
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
CREATE UNIQUE INDEX `productos_codigo_barras_unique` ON `productos` (`codigo_barras`);--> statement-breakpoint
CREATE TABLE `proveedores` (
	`id_proveedor` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text,
	`direccion` text,
	`email` text
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id_usuario` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`password` text NOT NULL,
	`rol` text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ventas` (
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
);
