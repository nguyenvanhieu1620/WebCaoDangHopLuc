CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`title_en` text,
	`description` text,
	`description_en` text,
	`location` text,
	`location_en` text,
	`start_at` text NOT NULL,
	`end_at` text,
	`cover_image_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`question_en` text,
	`answer` text NOT NULL,
	`answer_en` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `faculty` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `education` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `education_en` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `specialty` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `specialty_en` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `faculty` ADD `bio_en` text;--> statement-breakpoint
CREATE UNIQUE INDEX `faculty_slug_unique` ON `faculty` (`slug`);