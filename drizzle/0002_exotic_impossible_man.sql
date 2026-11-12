CREATE TABLE `review_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`reviewerAssignmentId` int,
	`actorId` int NOT NULL,
	`entityType` enum('assessment','control','evidence','finding') NOT NULL,
	`entityId` int,
	`eventType` enum('comment','approve','reject','request_changes','status_change') NOT NULL,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviewer_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`scope` enum('full','evidence','findings') NOT NULL DEFAULT 'full',
	`status` enum('invited','active','completed','declined','revoked') NOT NULL DEFAULT 'invited',
	`notes` text,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `reviewer_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviewer_assignment_unique` UNIQUE(`assessmentId`,`reviewerId`)
);
--> statement-breakpoint
ALTER TABLE `controls` ADD `sourceRefs` varchar(500);--> statement-breakpoint
ALTER TABLE `controls` ADD `lifecycleStage` varchar(64) DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `controls` ADD `controlType` varchar(64) DEFAULT 'governance' NOT NULL;--> statement-breakpoint
ALTER TABLE `controls` ADD `criticality` enum('low','moderate','high','critical') DEFAULT 'moderate' NOT NULL;--> statement-breakpoint
ALTER TABLE `organization_members` ADD `status` enum('invited','active','revoked') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `organization_members` ADD `invitedBy` int;--> statement-breakpoint
CREATE INDEX `review_events_assessment_idx` ON `review_events` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `review_events_actor_idx` ON `review_events` (`actorId`);--> statement-breakpoint
CREATE INDEX `reviewer_assignments_assessment_idx` ON `reviewer_assignments` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `reviewer_assignments_reviewer_idx` ON `reviewer_assignments` (`reviewerId`);