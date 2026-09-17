CREATE TABLE `construction_site_documents` (
	`id` varchar(128) NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`externalCode` varchar(64) NOT NULL,
	`status` varchar(24) NOT NULL,
	`document` json NOT NULL,
	`documentVersion` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `construction_site_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `construction_site_scope_updated_at_idx` ON `construction_site_documents` (`scopeKey`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `construction_site_scope_external_code_idx` ON `construction_site_documents` (`scopeKey`,`externalCode`);