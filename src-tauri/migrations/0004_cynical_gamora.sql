CREATE TABLE `carritos_vaciados` (
	`id_carrito_vaciado` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`items_json` text NOT NULL,
	`cantidad_items` integer NOT NULL,
	`total` real NOT NULL,
	`id_usuario` integer NOT NULL,
	`fecha` text DEFAULT (datetime('now','localtime')),
	`estado_revision` text DEFAULT 'pendiente' NOT NULL,
	`id_usuario_revisor` integer,
	`fecha_revision` text,
	FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_usuario_revisor`) REFERENCES `usuarios`(`id_usuario`) ON UPDATE no action ON DELETE no action
);
