import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Schema CSDL cho Website thông tin trường + CMS (Giai đoạn 1 theo SRS).
 *
 * Đang dùng SQLite (drizzle-orm/sqlite-core, qua driver @libsql/client — dùng
 * binary dựng sẵn theo hệ điều hành, không cần Python/node-gyp để cài) để
 * chạy ngay không cần server DB hay tài khoản AWS. Khi chuyển sang PostgreSQL (Amazon RDS Aurora — đúng
 * kiến trúc dài hạn trong SRS), chỉ cần:
 *   1) Đổi import "drizzle-orm/sqlite-core" -> "drizzle-orm/pg-core"
 *      (sqliteTable -> pgTable, tên các kiểu cột tương đương gần như 1-1)
 *   2) Đổi driver kết nối trong lib/db/client.ts
 * Toàn bộ code gọi Drizzle ở các trang/route khác — cú pháp query giống hệt
 * nhau giữa 2 dialect, hầu như không phải sửa.
 */

/** Tài khoản quản trị viên (đăng nhập CMS). */
export const adminUsers = sqliteTable("admin_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Bài viết — tin tức, thông báo, sự kiện hiển thị ở /tin-tuc. */
export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  /** "draft" (bản nháp) | "published" (đã đăng) */
  status: text("status").notNull().default("draft"),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Trang tĩnh có thể chỉnh sửa nội dung qua CMS (Giới thiệu, Liên hệ...). */
export const pages = sqliteTable("pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Mục media trong thư viện ảnh/video (metadata; file thật lưu ở /public khi dev, S3 khi production). */
export const mediaItems = sqliteTable("media_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  /** "image" | "video" */
  type: text("type").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Ngành đào tạo — hiển thị ở Trang chủ và /nganh-dao-tao. */
export const programs = sqliteTable("programs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  duration: text("duration").notNull(),
  intake: integer("intake").notNull(),
  summary: text("summary").notNull(),
  /** Nội dung chi tiết đầy đủ — để dành cho trang chi tiết ngành đào tạo, chưa bắt buộc nhập. */
  content: text("content"),
  /** 0 = không hiện ở Trang chủ, 1 = hiện. Nếu không ngành nào featured, Trang chủ tự lấy 6 ngành đầu. */
  featured: integer("featured").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Thông tin liên hệ/vận hành chung của site — luôn chỉ có đúng 1 dòng (id "main"). */
export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey().default("main"),
  hotline: text("hotline").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  announcement: text("announcement").notNull(),
  facebookUrl: text("facebook_url").notNull().default("#"),
  zaloUrl: text("zalo_url").notNull().default("#"),
  youtubeUrl: text("youtube_url").notNull().default("#"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Nội dung chữ ở Trang chủ (Hero, chỉ số, điểm mạnh, quy trình, CTA) — luôn chỉ có đúng 1 dòng (id "main"). */
export const homepageContent = sqliteTable("homepage_content", {
  id: text("id").primaryKey().default("main"),
  heroBadge: text("hero_badge").notNull(),
  heroTitleLine1: text("hero_title_line1").notNull(),
  heroTitleLine2: text("hero_title_line2").notNull(),
  heroDescription: text("hero_description").notNull(),
  heroImageCardLabel: text("hero_image_card_label").notNull(),
  heroImageCardTitle: text("hero_image_card_title").notNull(),
  /** VD "4.8" — số điểm đánh giá lớn hiển thị cạnh sao. */
  heroRatingValue: text("hero_rating_value").notNull(),
  /** VD "Đánh giá từ 1.240 phụ huynh & sinh viên" — dòng chú thích bên dưới điểm. */
  heroRatingText: text("hero_rating_text").notNull(),
  /** JSON.stringify của mảng 4 {value,label}. */
  statsJson: text("stats_json").notNull(),
  /** JSON.stringify của mảng 3 {title,desc}. */
  featuresJson: text("features_json").notNull(),
  /** JSON.stringify của mảng 4 {title,desc}. */
  stepsJson: text("steps_json").notNull(),
  ctaTitle: text("cta_title").notNull(),
  ctaDescription: text("cta_description").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Hồ sơ đăng ký xét tuyển gửi từ form công khai trên website. */
export const admissionSubmissions = sqliteTable("admission_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  program: text("program").notNull(),
  note: text("note"),
  /** "new" (mới) | "reviewed" (đã xem) | "contacted" (đã liên hệ) */
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type MediaItem = typeof mediaItems.$inferSelect;
export type AdmissionSubmission = typeof admissionSubmissions.$inferSelect;
export type NewAdmissionSubmission = typeof admissionSubmissions.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type HomepageContentRow = typeof homepageContent.$inferSelect;
