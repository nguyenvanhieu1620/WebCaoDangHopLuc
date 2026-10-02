CREATE TABLE `admission_items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`title_en` text,
	`detail` text,
	`detail_en` text,
	`meta` text,
	`meta_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `nav_items` ADD `description` text;--> statement-breakpoint
ALTER TABLE `nav_items` ADD `description_en` text;--> statement-breakpoint
ALTER TABLE `programs` ADD `tuition` text;--> statement-breakpoint
ALTER TABLE `programs` ADD `tuition_en` text;