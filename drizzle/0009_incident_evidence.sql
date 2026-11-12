CREATE TABLE `incident_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`organizationId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`fileSize` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `incident_evidence_incident_idx` ON `incident_evidence` (`incidentId`);--> statement-breakpoint
CREATE INDEX `incident_evidence_organization_idx` ON `incident_evidence` (`organizationId`);