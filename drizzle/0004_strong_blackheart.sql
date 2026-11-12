CREATE TABLE `external_reviewer_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`scope` enum('full','evidence','findings','domain') NOT NULL DEFAULT 'full',
	`domainId` int,
	`notes` text,
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','declined','expired','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedBy` int,
	`acceptedAt` timestamp,
	`declinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `external_reviewer_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_reviewer_invites_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `external_invites_assessment_idx` ON `external_reviewer_invites` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `external_invites_email_idx` ON `external_reviewer_invites` (`email`);--> statement-breakpoint
CREATE INDEX `external_invites_status_idx` ON `external_reviewer_invites` (`status`);