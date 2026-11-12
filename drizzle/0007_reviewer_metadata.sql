ALTER TABLE `reviewer_assignments` ADD `professionalRole` varchar(120);--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `expertise` varchar(500);--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `sectorExperience` varchar(500);--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `jurisdictionFamiliarity` varchar(120);--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `languageCapability` varchar(120);--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `conflictDeclared` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `independenceStatus` varchar(120);