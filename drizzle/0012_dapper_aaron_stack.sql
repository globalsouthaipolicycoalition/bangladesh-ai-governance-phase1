ALTER TABLE `observatory_observations` ADD `observationKind` enum('reported','estimate','projection') DEFAULT 'reported' NOT NULL;--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `collectionMethod` varchar(255);--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `sourceTimestamp` timestamp;--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `confidence` decimal(5,2);--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `verificationStatus` enum('unverified','reviewed','independently_verified') DEFAULT 'unverified' NOT NULL;