CREATE TABLE `admin_data_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(120) NOT NULL,
	`action` enum('created','updated','archived','published','status_changed','imported','corrected') NOT NULL,
	`reason` varchar(1000) NOT NULL,
	`beforeData` text,
	`afterData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_data_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_data_audit_actor_idx` ON `admin_data_audit` (`actorId`);--> statement-breakpoint
CREATE INDEX `admin_data_audit_entity_idx` ON `admin_data_audit` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `admin_data_audit_created_idx` ON `admin_data_audit` (`createdAt`);