ALTER TABLE `admission_submissions` ADD `id_number` text;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `lms_url` text DEFAULT '#' NOT NULL;