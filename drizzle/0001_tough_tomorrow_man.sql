CREATE TABLE `storage_asset_backfill_runs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`mode` enum('dry_run','apply') NOT NULL,
	`status` enum('running','completed','completed_with_errors','failed') NOT NULL DEFAULT 'running',
	`source` varchar(96) NOT NULL,
	`documentCount` int NOT NULL DEFAULT 0,
	`referenceCount` int NOT NULL DEFAULT 0,
	`assetCount` int NOT NULL DEFAULT 0,
	`unresolvedCount` int NOT NULL DEFAULT 0,
	`errorSummary` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `storage_asset_backfill_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storage_asset_references` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`assetId` bigint unsigned NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`constructionSiteId` varchar(128) NOT NULL,
	`documentVersion` int NOT NULL,
	`firstReferencedAt` timestamp NOT NULL DEFAULT (now()),
	`lastReferencedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storage_asset_references_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_asset_reference_asset_site_unique` UNIQUE(`assetId`,`constructionSiteId`)
);
--> statement-breakpoint
CREATE TABLE `storage_assets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`storageKeyHash` varchar(64) NOT NULL,
	`lifecycle` enum('pending','active','quarantined','manual_review') NOT NULL DEFAULT 'pending',
	`purpose` varchar(64) NOT NULL DEFAULT 'unknown',
	`contentType` varchar(128),
	`sizeBytes` int unsigned,
	`expiresAt` timestamp,
	`lastReferencedAt` timestamp,
	`quarantinedAt` timestamp,
	`lastReconciledAt` timestamp,
	`lastError` varchar(512),
	`protected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storage_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_asset_scope_key_hash_unique` UNIQUE(`scopeKey`,`storageKeyHash`)
);
--> statement-breakpoint
CREATE TABLE `storage_retention_schedules` (
	`id` varchar(64) NOT NULL,
	`scopeKey` varchar(96) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`enabled` boolean NOT NULL DEFAULT false,
	`minUnreferencedAgeDays` int NOT NULL DEFAULT 30,
	`pendingGraceDays` int NOT NULL DEFAULT 7,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storage_retention_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `storage_retention_schedules_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`),
	CONSTRAINT `storage_retention_schedule_scope_unique` UNIQUE(`scopeKey`)
);
--> statement-breakpoint
CREATE INDEX `storage_asset_backfill_scope_started_idx` ON `storage_asset_backfill_runs` (`scopeKey`,`startedAt`);--> statement-breakpoint
CREATE INDEX `storage_asset_reference_scope_site_idx` ON `storage_asset_references` (`scopeKey`,`constructionSiteId`);--> statement-breakpoint
CREATE INDEX `storage_asset_scope_lifecycle_idx` ON `storage_assets` (`scopeKey`,`lifecycle`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `storage_asset_expiry_idx` ON `storage_assets` (`lifecycle`,`expiresAt`);