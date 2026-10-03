CREATE TABLE `page_banners` (
	`key` text PRIMARY KEY NOT NULL,
	`image_url` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
