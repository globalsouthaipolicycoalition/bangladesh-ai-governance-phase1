ALTER TABLE `assessments` ADD `organizationName` varchar(255);--> statement-breakpoint
ALTER TABLE `assessments` ADD `division` varchar(64);--> statement-breakpoint
ALTER TABLE `assessments` ADD `district` varchar(120);--> statement-breakpoint
ALTER TABLE `assessments` ADD `locality` varchar(120);--> statement-breakpoint
ALTER TABLE `assessments` ADD `organizationType` varchar(80);--> statement-breakpoint
ALTER TABLE `assessments` ADD `ownershipType` varchar(80);--> statement-breakpoint
ALTER TABLE `assessments` ADD `employeeCount` varchar(32);--> statement-breakpoint
ALTER TABLE `assessments` ADD `dataResidency` varchar(80);--> statement-breakpoint
ALTER TABLE `assessments` ADD `primaryLanguage` varchar(80);--> statement-breakpoint
ALTER TABLE `assessments` ADD `regulatedSector` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `entityClassification` varchar(80);