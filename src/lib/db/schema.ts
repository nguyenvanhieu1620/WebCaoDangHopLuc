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

/** Danh mục bài viết (Tuyển sinh, Sự kiện...) — admin tự thêm/xoá không giới hạn. */
export const categories = sqliteTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
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
  categoryId: text("category_id"),
  coverImageUrl: text("cover_image_url"),
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
  heroImageUrl: text("hero_image_url"),
  heroBadge: text("hero_badge").notNull(),
  heroTitleLine1: text("hero_title_line1").notNull(),
  heroTitleLine2: text("hero_title_line2").notNull(),
  heroDescription: text("hero_description").notNull(),
  /** 2 badge số liệu nổi trên ảnh Hero, VD "12+"/"Năm đào tạo" và "96%"/"Có việc làm". */
  heroBadge1Value: text("hero_badge1_value").notNull(),
  heroBadge1Label: text("hero_badge1_label").notNull(),
  heroBadge2Value: text("hero_badge2_value").notNull(),
  heroBadge2Label: text("hero_badge2_label").notNull(),
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

/** Đối tác hiển thị ở dải logo/tên Trang chủ — sortOrder do admin tự nhập để sắp vị trí. */
export const partners = sqliteTable("partners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Ảnh trong khối "Thư viện" dạng bento ở Trang chủ. */
export const galleryItems = sqliteTable("gallery_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Đội ngũ giảng viên hiển thị ở Trang chủ. */
export const faculty = sqliteTable("faculty", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  role: text("role").notNull(),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Đánh giá/cảm nhận của cựu sinh viên hiển thị ở Trang chủ. */
export const testimonials = sqliteTable("testimonials", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
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
export type Category = typeof categories.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type Faculty = typeof faculty.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
