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
  /** Bản tiếng Anh của `name` — để trống thì site hiện bản tiếng Việt khi khách chọn EN. */
  nameEn: text("name_en"),
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
  titleEn: text("title_en"),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  excerptEn: text("excerpt_en"),
  content: text("content").notNull(),
  contentEn: text("content_en"),
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
  titleEn: text("title_en"),
  /** Ảnh banner đầu trang — tuỳ chọn, không có thì trang không hiện khối ảnh. */
  coverImageUrl: text("cover_image_url"),
  content: text("content").notNull(),
  contentEn: text("content_en"),
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
  nameEn: text("name_en"),
  duration: text("duration").notNull(),
  intake: integer("intake").notNull(),
  summary: text("summary").notNull(),
  summaryEn: text("summary_en"),
  /** Nội dung chi tiết đầy đủ — để dành cho trang chi tiết ngành đào tạo, chưa bắt buộc nhập. */
  content: text("content"),
  contentEn: text("content_en"),
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
  announcementEn: text("announcement_en"),
  facebookUrl: text("facebook_url").notNull().default("#"),
  zaloUrl: text("zalo_url").notNull().default("#"),
  youtubeUrl: text("youtube_url").notNull().default("#"),
  /** Link cổng LMS VNPT — hiện ở trang /lms. Để trống ("#") tới khi trường cung cấp link thật. */
  lmsUrl: text("lms_url").notNull().default("#"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Nội dung chữ ở Trang chủ (Hero, chỉ số, điểm mạnh, quy trình, CTA) — luôn chỉ có đúng 1 dòng (id "main"). */
export const homepageContent = sqliteTable("homepage_content", {
  id: text("id").primaryKey().default("main"),
  heroImageUrl: text("hero_image_url"),
  heroBadge: text("hero_badge").notNull(),
  heroBadgeEn: text("hero_badge_en"),
  heroTitleLine1: text("hero_title_line1").notNull(),
  heroTitleLine1En: text("hero_title_line1_en"),
  heroTitleLine2: text("hero_title_line2").notNull(),
  heroTitleLine2En: text("hero_title_line2_en"),
  heroDescription: text("hero_description").notNull(),
  heroDescriptionEn: text("hero_description_en"),
  /** 2 badge số liệu nổi trên ảnh Hero, VD "12+"/"Năm đào tạo" và "96%"/"Có việc làm". */
  heroBadge1Value: text("hero_badge1_value").notNull(),
  heroBadge1Label: text("hero_badge1_label").notNull(),
  heroBadge1LabelEn: text("hero_badge1_label_en"),
  heroBadge2Value: text("hero_badge2_value").notNull(),
  heroBadge2Label: text("hero_badge2_label").notNull(),
  heroBadge2LabelEn: text("hero_badge2_label_en"),
  /** JSON.stringify của mảng 4 {value,label}. */
  statsJson: text("stats_json").notNull(),
  statsJsonEn: text("stats_json_en"),
  /** JSON.stringify của mảng 3 {title,desc}. */
  featuresJson: text("features_json").notNull(),
  featuresJsonEn: text("features_json_en"),
  /** JSON.stringify của mảng 4 {title,desc}. */
  stepsJson: text("steps_json").notNull(),
  stepsJsonEn: text("steps_json_en"),
  ctaTitle: text("cta_title").notNull(),
  ctaTitleEn: text("cta_title_en"),
  ctaDescription: text("cta_description").notNull(),
  ctaDescriptionEn: text("cta_description_en"),
  /** Sứ mệnh/Tầm nhìn tóm tắt hiện ở Trang chủ — tuỳ chọn, để trống thì ẩn cả khối. */
  missionText: text("mission_text"),
  missionTextEn: text("mission_text_en"),
  visionText: text("vision_text"),
  visionTextEn: text("vision_text_en"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Mục menu chính của site công khai — danh mục to (parentId null) và danh mục con (parentId trỏ tới 1 danh mục to). */
export const navItems = sqliteTable("nav_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  labelEn: text("label_en"),
  href: text("href").notNull(),
  /** null = danh mục to. Có giá trị = danh mục con thuộc nav_items.id đó. */
  parentId: text("parent_id"),
  /** Chỉ áp dụng cho danh mục to: 1 = hiện ở thanh ngang chính, 0 = nằm trong nút ☰ "Danh mục khác". */
  isPrimary: integer("is_primary").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Danh sách nút liên hệ nhanh nổi góc màn hình (`QuickContactWidget`) —
 * admin tự thêm/sửa/xoá/sắp thứ tự, mỗi mục tự chọn `type` (quyết định icon
 * hiện ra) + `href` riêng (tel:, https://zalo.me/..., link chatbot ngoài...).
 * Trước đây cố định cứng 3 kênh (Hotline/Zalo/Facebook) lấy từ
 * `site_settings` — giờ tách hẳn ra đây để linh hoạt thêm kênh mới (Tin
 * nhắn, ChatbotAI...) mà không phải sửa code.
 */
export const quickContacts = sqliteTable("quick_contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** "hotline" | "zalo" | "facebook" | "message" | "chatbot" | "custom" — quyết định icon hiển thị. */
  type: text("type").notNull(),
  label: text("label").notNull(),
  labelEn: text("label_en"),
  /** Link đầy đủ — VD "tel:19006868", "https://zalo.me/...". Nhập nguyên href, không tự ghép. */
  href: text("href").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Đối tác hiển thị ở dải logo/tên Trang chủ — sortOrder do admin tự nhập để sắp vị trí. */
export const partners = sqliteTable("partners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEn: text("name_en"),
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
  captionEn: text("caption_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Ảnh banner Hero Trang chủ — nhiều ảnh xoay vòng (thay cho 1 ảnh cố định
 * `homepage_content.hero_image_url` trước đây). Nếu bảng này rỗng, Trang chủ
 * tự fallback về `heroImageUrl` cũ — không bắt buộc admin phải thêm ngay.
 */
export const heroBanners = sqliteTable("hero_banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  captionEn: text("caption_en"),
  /** Bấm vào banner điều hướng tới đâu — tuỳ chọn, để trống thì banner không phải link. */
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Danh mục Học hàm / Học vị / Chức vụ cho Giảng viên — 3 danh sách tách rời
 * bằng cột `type`, quản lý chung 1 trang admin (`admin/danh-hieu`) để thêm
 * 1 lần, chọn qua dropdown khi tạo giảng viên thay vì gõ tay tự do (tránh
 * "ThS" và "Th.S" cùng tồn tại). Chỉ dùng trong admin — không cần lớp data
 * layer riêng (theo đúng quy ước admin gọi `db` trực tiếp).
 */
export const facultyAttributes = sqliteTable("faculty_attributes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** "academic_rank" (Học hàm) | "degree" (Học vị) | "position" (Chức vụ). */
  type: text("type").notNull(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Khoa/Bộ môn — danh mục quản lý giảng viên theo đơn vị, giống `categories` cho bài viết. */
export const departments = sqliteTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Đội ngũ giảng viên hiển thị ở Trang chủ và trang chi tiết /doi-ngu-giang-vien/[slug]. */
export const faculty = sqliteTable("faculty", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /**
   * Dùng cho URL trang chi tiết — tự sinh từ tên, không bắt buộc nhập tay.
   * Để nullable (thay vì notNull như slug các bảng khác) vì bảng này đã có
   * sẵn dữ liệu — SQLite không cho ALTER TABLE thêm cột NOT NULL vào bảng
   * đã có dòng mà không có DEFAULT. Action luôn tự sinh + set slug lúc tạo
   * mới, nên trong thực tế cột này luôn có giá trị.
   */
  slug: text("slug").unique(),
  /** Chỉ họ tên thuần — KHÔNG gõ dính học vị/học hàm vào đây (tách riêng ở `degree`/`academicRank`). */
  name: text("name").notNull(),
  /** Chức vụ, VD "Trưởng khoa Điều dưỡng", "Hiệu trưởng". */
  role: text("role").notNull(),
  roleEn: text("role_en"),
  /** Khoa/Bộ môn trực thuộc — trỏ tới `departments.id`, tuỳ chọn (VD Ban Giám hiệu có thể không thuộc khoa nào). */
  departmentId: text("department_id"),
  /** Học vị/bằng cấp viết tắt để ghép trước tên khi hiển thị, VD "ThS.BS", "TS", "DS.CKI". */
  degree: text("degree"),
  degreeEn: text("degree_en"),
  /** Học hàm — hiếm, chỉ có ở GS/PGS, để trống với đa số giảng viên. */
  academicRank: text("academic_rank"),
  academicRankEn: text("academic_rank_en"),
  /**
   * Không dùng nữa — trước đây gộp học vị + trường + ngành vào 1 ô free-text,
   * đã tách rõ thành `degree` (học vị viết tắt) + `bio` (tiểu sử đầy đủ nếu
   * cần ghi thêm nơi đào tạo). Giữ lại cột này (rỗng) để tránh phải đổi tên
   * cột — SQLite rename dễ bị drizzle-kit hiểu nhầm thành xoá+thêm cột mới.
   */
  education: text("education"),
  educationEn: text("education_en"),
  /** Chuyên môn/lĩnh vực giảng dạy — tuỳ chọn, hiện ở trang chi tiết. */
  specialty: text("specialty"),
  specialtyEn: text("specialty_en"),
  /** Tiểu sử đầy đủ (Markdown) — tuỳ chọn, chỉ hiện ở trang chi tiết, không hiện ở thẻ rút gọn. */
  bio: text("bio"),
  bioEn: text("bio_en"),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Sự kiện — lịch sự kiện riêng ở /su-kien, khác Tin tức (không có trạng thái nháp/đăng). */
export const events = sqliteTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  location: text("location"),
  locationEn: text("location_en"),
  /** Thời điểm bắt đầu — bắt buộc, dùng để sắp xếp + tách "Sắp diễn ra"/"Đã diễn ra". */
  startAt: text("start_at").notNull(),
  /** Thời điểm kết thúc — tuỳ chọn, để trống nếu sự kiện diễn ra trong 1 buổi. */
  endAt: text("end_at"),
  coverImageUrl: text("cover_image_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Tin nhắn gửi từ form Liên hệ công khai — admin xem/đổi trạng thái qua admin/lien-he. */
export const contactMessages = sqliteTable("contact_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  message: text("message").notNull(),
  /** "new" (mới) | "read" (đã xem) */
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

/** Câu hỏi thường gặp — hiện ở /faq, admin sắp xếp qua sortOrder. */
export const faqs = sqliteTable("faqs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  question: text("question").notNull(),
  questionEn: text("question_en"),
  answer: text("answer").notNull(),
  answerEn: text("answer_en"),
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
  quoteEn: text("quote_en"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  roleEn: text("role_en"),
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
  /** Số CCCD — khoá dùng để tra cứu kết quả xét tuyển công khai ở /tra-cuu-ket-qua. */
  idNumber: text("id_number"),
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
export type NavItem = typeof navItems.$inferSelect;
export type Event = typeof events.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type HeroBanner = typeof heroBanners.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type FacultyAttribute = typeof facultyAttributes.$inferSelect;
export type QuickContact = typeof quickContacts.$inferSelect;
