ALTER TABLE `assessments` ADD `controlSelectionVersion` varchar(48) DEFAULT 'selection-1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `controlSelectionSnapshot` text;--> statement-breakpoint
ALTER TABLE `assessments` ADD `controlSelectionHash` varchar(64);--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `sector` varchar(120);--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `geographicCoverage` varchar(255);--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `dataType` enum('numeric','percentage','count','currency','text','binary') DEFAULT 'numeric' NOT NULL;--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `baselineValue` decimal(18,6);--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `currentValue` decimal(18,6);--> statement-breakpoint
ALTER TABLE `observatory_indicators` ADD `targetValue` decimal(18,6);--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `verificationNotes` text;--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `verifiedBy` int;--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `observatory_observations` ADD `supersedesObservationId` int;