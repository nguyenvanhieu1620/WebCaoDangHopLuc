CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `faculty` ADD `department_id` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `degree` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `degree_en` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `academic_rank` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `academic_rank_en` text;