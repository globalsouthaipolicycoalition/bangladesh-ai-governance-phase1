CREATE TABLE `observatory_indicators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(48) NOT NULL,
	`title` varchar(255) NOT NULL,
	`domain` varchar(120) NOT NULL,
	`definition` text NOT NULL,
	`unit` varchar(80),
	`methodologyVersion` varchar(48) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `observatory_indicators_id` PRIMARY KEY(`id`),
	CONSTRAINT `observatory_indicators_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `observatory_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`indicatorId` int NOT NULL,
	`sourceId` int NOT NULL,
	`value` decimal(18,6),
	`valueLabel` varchar(255),
	`observationDate` timestamp NOT NULL,
	`periodLabel` varchar(120),
	`notes` text,
	`methodologyVersion` varchar(48) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`publishedBy` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `observatory_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observatory_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`publisher` varchar(255) NOT NULL,
	`url` varchar(700) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `observatory_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `observatory_indicators_domain_idx` ON `observatory_indicators` (`domain`);--> statement-breakpoint
CREATE INDEX `observatory_observations_indicator_idx` ON `observatory_observations` (`indicatorId`);--> statement-breakpoint
CREATE INDEX `observatory_observations_source_idx` ON `observatory_observations` (`sourceId`);--> statement-breakpoint
CREATE INDEX `observatory_observations_status_date_idx` ON `observatory_observations` (`status`,`observationDate`);--> statement-breakpoint
CREATE INDEX `observatory_sources_name_idx` ON `observatory_sources` (`name`);