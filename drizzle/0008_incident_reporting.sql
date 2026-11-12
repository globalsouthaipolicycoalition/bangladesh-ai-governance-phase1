CREATE TABLE `incident_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`organizationId` int NOT NULL,
	`actorId` int NOT NULL,
	`eventType` enum('created','updated','triaged','status_changed','evidence_added','comment','closed') NOT NULL,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incident_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('safety','privacy','security','bias','accuracy','availability','misuse','other') NOT NULL,
	`severity` enum('low','moderate','high','critical') NOT NULL DEFAULT 'moderate',
	`status` enum('submitted','triage','investigating','response','monitoring','closed','dismissed') NOT NULL DEFAULT 'submitted',
	`occurredAt` timestamp,
	`detectedAt` timestamp,
	`affectedSystem` varchar(255),
	`impactSummary` text,
	`containment` text,
	`rootCause` text,
	`responseSummary` text,
	`remediationPlan` text,
	`evidenceNotes` text,
	`closureSummary` text,
	`assignedTo` int,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incident_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `incident_events_incident_idx` ON `incident_events` (`incidentId`);--> statement-breakpoint
CREATE INDEX `incident_events_organization_idx` ON `incident_events` (`organizationId`);--> statement-breakpoint
CREATE INDEX `incident_reports_organization_idx` ON `incident_reports` (`organizationId`);--> statement-breakpoint
CREATE INDEX `incident_reports_reporter_idx` ON `incident_reports` (`reportedBy`);--> statement-breakpoint
CREATE INDEX `incident_reports_status_idx` ON `incident_reports` (`status`);