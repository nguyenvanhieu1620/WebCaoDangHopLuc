CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
ALTER TABLE `gallery_items` ADD `video_url` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `is_pinned` integer DEFAULT 0 NOT NULL;