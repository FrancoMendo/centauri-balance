CREATE TABLE `metodos_pago` (
	`id_metodo` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`comision_porcentaje` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ventas` ADD `comision_porcentaje` real DEFAULT 0 NOT NULL;