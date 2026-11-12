CREATE TABLE `action_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`findingId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int,
	`dueDate` timestamp,
	`status` enum('planned','in_progress','blocked','done') NOT NULL DEFAULT 'planned',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `action_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int,
	`assessmentId` int,
	`name` varchar(255) NOT NULL,
	`provider` varchar(255),
	`purpose` text,
	`decisionImpact` varchar(80),
	`humanOversight` varchar(80),
	`lifecycleStatus` varchar(80) NOT NULL DEFAULT 'discovery',
	`riskLevel` enum('low','moderate','high','critical') NOT NULL DEFAULT 'moderate',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_systems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessment_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`controlId` int NOT NULL,
	`responseScore` int,
	`evidenceStatus` enum('not_requested','missing','submitted','verified','rejected') NOT NULL DEFAULT 'not_requested',
	`responseNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessment_controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessment_control_unique` UNIQUE(`assessmentId`,`controlId`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organizationId` int,
	`profileType` enum('individual','organization','enterprise','government','national') NOT NULL,
	`title` varchar(255) NOT NULL,
	`jurisdiction` varchar(120),
	`sector` varchar(120),
	`posture` enum('self_assessment','evidence_audit','expert_review') NOT NULL DEFAULT 'self_assessment',
	`status` enum('draft','in_progress','submitted','review','complete') NOT NULL DEFAULT 'draft',
	`score` decimal(6,2) NOT NULL DEFAULT '0.00',
	`evidenceCoverage` decimal(6,2) NOT NULL DEFAULT '0.00',
	`methodologyVersion` varchar(32) NOT NULL DEFAULT 'GAAF-1.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domainId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`objective` text,
	`evidenceRequirement` text,
	`applicability` text,
	`weight` decimal(8,2) NOT NULL DEFAULT '1.00',
	`version` varchar(32) NOT NULL DEFAULT 'GAAF-1.0',
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `controls_id` PRIMARY KEY(`id`),
	CONSTRAINT `controls_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `domains_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`controlId` int,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(700) NOT NULL,
	`mimeType` varchar(120),
	`fileSize` int,
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`controlId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`recommendation` text,
	`severity` enum('low','moderate','high','critical') NOT NULL DEFAULT 'moderate',
	`status` enum('open','accepted','in_progress','resolved','waived') NOT NULL DEFAULT 'open',
	`ownerId` int,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','reviewer','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_member_unique` UNIQUE(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`sector` varchar(120),
	`jurisdiction` varchar(120),
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`type` enum('individual','organizational','government','national') NOT NULL,
	`format` enum('pdf','excel','json') NOT NULL,
	`status` enum('queued','generating','ready','failed') NOT NULL DEFAULT 'queued',
	`storageUrl` varchar(700),
	`generatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assessment_controls_assessment_idx` ON `assessment_controls` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `assessments_user_idx` ON `assessments` (`userId`);--> statement-breakpoint
CREATE INDEX `assessments_org_idx` ON `assessments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `controls_domain_idx` ON `controls` (`domainId`);--> statement-breakpoint
CREATE INDEX `evidence_assessment_idx` ON `evidence` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `findings_assessment_idx` ON `findings` (`assessmentId`);--> statement-breakpoint
CREATE INDEX `organizations_owner_idx` ON `organizations` (`ownerId`);