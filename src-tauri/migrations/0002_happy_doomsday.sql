CREATE TABLE `parametros` (
	`id_parametro` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`date` text DEFAULT (CURRENT_DATE) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parametros_key_unique` ON `parametros` (`key`);