ALTER TABLE `assessments` MODIFY COLUMN `status` enum('draft','in_progress','submitted','review','changes_requested','verified','complete','closed') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `organization_members` MODIFY COLUMN `role` enum('owner','admin','lead_reviewer','reviewer','domain_reviewer','evidence_reviewer','auditor','contributor','member') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `reviewer_assignments` MODIFY COLUMN `scope` enum('full','evidence','findings','domain') NOT NULL DEFAULT 'full';--> statement-breakpoint
ALTER TABLE `assessment_controls` ADD `reviewDecision` enum('pending','approved','rejected','changes_requested') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `domainId` int;--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `acceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `reviewer_assignments` ADD `declinedAt` timestamp;