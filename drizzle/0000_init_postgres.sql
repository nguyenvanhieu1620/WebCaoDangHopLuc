CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "admin_users_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"permissions" text,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admission_items" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "admission_items_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"title" text NOT NULL,
	"title_en" text,
	"detail" text,
	"detail_en" text,
	"meta" text,
	"meta_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "admission_submissions_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"id_number" text,
	"email" text,
	"program" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "categories_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"name_en" text,
	"slug" text NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "contact_messages_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "departments_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"name_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "events_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text,
	"title" text NOT NULL,
	"title_en" text,
	"description" text,
	"description_en" text,
	"location" text,
	"location_en" text,
	"start_at" text NOT NULL,
	"end_at" text,
	"cover_image_url" text,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "faculty_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"role_en" text,
	"department_id" text,
	"degree" text,
	"degree_en" text,
	"academic_rank" text,
	"academic_rank_en" text,
	"education" text,
	"education_en" text,
	"specialty" text,
	"specialty_en" text,
	"bio" text,
	"bio_en" text,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "faculty_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "faculty_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "faculty_attributes_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "faqs_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question" text NOT NULL,
	"question_en" text,
	"answer" text NOT NULL,
	"answer_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "gallery_items_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"image_url" text NOT NULL,
	"video_url" text,
	"caption" text NOT NULL,
	"caption_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hero_banners" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "hero_banners_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"image_url" text NOT NULL,
	"caption" text,
	"caption_en" text,
	"link_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_content" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"hero_image_url" text,
	"hero_badge" text NOT NULL,
	"hero_badge_en" text,
	"hero_title_line1" text NOT NULL,
	"hero_title_line1_en" text,
	"hero_title_line2" text NOT NULL,
	"hero_title_line2_en" text,
	"hero_description" text NOT NULL,
	"hero_description_en" text,
	"hero_badge1_value" text NOT NULL,
	"hero_badge1_label" text NOT NULL,
	"hero_badge1_label_en" text,
	"hero_badge2_value" text NOT NULL,
	"hero_badge2_label" text NOT NULL,
	"hero_badge2_label_en" text,
	"stats_json" text NOT NULL,
	"stats_json_en" text,
	"features_json" text NOT NULL,
	"features_json_en" text,
	"steps_json" text NOT NULL,
	"steps_json_en" text,
	"cta_title" text NOT NULL,
	"cta_title_en" text,
	"cta_description" text NOT NULL,
	"cta_description_en" text,
	"mission_text" text,
	"mission_text_en" text,
	"vision_text" text,
	"vision_text_en" text,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "media_items_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "milestones_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"year" integer NOT NULL,
	"period" text,
	"period_en" text,
	"title" text NOT NULL,
	"title_en" text,
	"description" text,
	"description_en" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nav_items" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "nav_items_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"label_en" text,
	"href" text NOT NULL,
	"description" text,
	"description_en" text,
	"parent_id" text,
	"is_primary" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "newsletter_subscribers_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "page_banners" (
	"key" text PRIMARY KEY NOT NULL,
	"image_url" text,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "pages_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_en" text,
	"cover_image_url" text,
	"content" text NOT NULL,
	"content_en" text,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "partners_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"name_en" text,
	"logo_url" text,
	"website_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "posts_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"title_en" text,
	"slug" text NOT NULL,
	"excerpt" text,
	"excerpt_en" text,
	"content" text NOT NULL,
	"content_en" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"category_id" text,
	"cover_image_url" text,
	"is_pinned" integer DEFAULT 0 NOT NULL,
	"attachment_url" text,
	"attachment_name" text,
	"published_at" text,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "programs_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"duration" text NOT NULL,
	"intake" integer NOT NULL,
	"summary" text NOT NULL,
	"summary_en" text,
	"content" text,
	"content_en" text,
	"tuition" text,
	"tuition_en" text,
	"image_url" text,
	"featured" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL,
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quick_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "quick_contacts_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"label" text NOT NULL,
	"label_en" text,
	"href" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"hotline" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"announcement" text NOT NULL,
	"announcement_en" text,
	"facebook_url" text DEFAULT '#' NOT NULL,
	"zalo_url" text DEFAULT '#' NOT NULL,
	"youtube_url" text DEFAULT '#' NOT NULL,
	"lms_url" text DEFAULT '#' NOT NULL,
	"page_banner_url" text,
	"updated_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "testimonials_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"quote" text NOT NULL,
	"quote_en" text,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"role_en" text,
	"avatar_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS') NOT NULL
);
