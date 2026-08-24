CREATE TABLE `hero_banners` (
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text NOT NULL,
	`caption` text,
	`caption_en` text,
	`link_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
