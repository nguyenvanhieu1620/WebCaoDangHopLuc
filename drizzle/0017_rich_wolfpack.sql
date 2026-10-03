CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`period` text,
	`period_en` text,
	`title` text NOT NULL,
	`title_en` text,
	`description` text,
	`description_en` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `site_settings` ADD `page_banner_url` text;