ALTER TABLE `assessment_controls` ADD `applicabilityStatus` enum('applicable','not_applicable_pending','not_applicable_accepted','not_applicable_rejected') DEFAULT 'applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE `assessment_controls` ADD `applicabilityRationale` text;--> statement-breakpoint
ALTER TABLE `assessment_controls` ADD `applicabilityReviewedBy` int;--> statement-breakpoint
ALTER TABLE `assessment_controls` ADD `applicabilityReviewedAt` timestamp;