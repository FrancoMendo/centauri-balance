ALTER TABLE `egresos` ADD `categoria` text DEFAULT 'Otros' NOT NULL;--> statement-breakpoint
ALTER TABLE `egresos` ADD `metodo_pago` text DEFAULT 'Efectivo' NOT NULL;--> statement-breakpoint
ALTER TABLE `egresos` ADD `id_proveedor` integer REFERENCES proveedores(id_proveedor);--> statement-breakpoint
ALTER TABLE `ventas` ADD `id_operacion` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `ventas` ADD `metodo_pago` text DEFAULT 'Efectivo' NOT NULL;