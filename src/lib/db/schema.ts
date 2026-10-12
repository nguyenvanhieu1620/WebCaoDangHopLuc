import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Schema CSDL cho Website thông tin trường + CMS (Giai đoạn 1 theo SRS).
 *
 * PostgreSQL (drizzle-orm/pg-core, driver `pg` — xem lib/db/client.ts). Chuyển từ
 * SQLite sang ngày 06/10/2026, giữ nguyên 1-1 kiểu dữ liệu cũ để không phải sửa
 * code đọc/ghi ở các trang:
 *   - Mốc thời gian vẫn là `text` dạng "YYYY-MM-DD HH:MM:SS" (UTC) — đúng định dạng
 *     `CURRENT_TIMESTAMP` của SQLite trước đây (xem `nowText` bên dưới) nên
 *     `formatDbDateTime()`/`dbTimestampToISO()` trong utils.ts dùng tiếp được.
 *     Cột do code tự set (`publishedAt`, `startAt`, `updatedAt` khi sửa...) là chuỗi ISO.
 *   - Cờ 0/1 (`featured`, `isPinned`, `isPrimary`) vẫn là `integer`.
 *   - `seq`: số tự tăng theo thứ tự chèn, thay cho `rowid` ngầm của SQLite. SQLite
 *     trả các dòng trùng khoá sắp xếp (VD cùng `sortOrder`, cùng giây `createdAt`)
 *     theo thứ tự chèn; Postgres KHÔNG đảm bảo điều đó — dòng vừa sửa có thể nhảy
 *     xuống cuối. Mọi `orderBy` của danh sách luôn thêm `seq` làm khoá phụ cuối cùng.
 * Muốn đổi sang kiểu gốc của Postgres (timestamptz, boolean) thì làm migration riêng
 * kèm sửa chỗ đọc/ghi — không trộn vào đợt chuyển DB.
 */

/** Giá trị mặc định cho cột thời gian — chuỗi "YYYY-MM-DD HH:MM:SS" theo giờ UTC (y hệt SQLite CURRENT_TIMESTAMP). */
const nowText = sql`to_char(timezone('UTC', now()), 'YYYY-MM-DD HH24:MI:SS')`;

/** Khoá phụ thứ tự chèn (xem ghi chú đầu file) — chỉ dùng trong `orderBy`, không hiển thị. */
const seq = () => integer("seq").generatedAlwaysAsIdentity();

/** Tài khoản quản trị viên (đăng nhập CMS). */
export const adminUsers = pgTable("admin_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  /**
   * Mảng JSON các module được phép truy cập (VD `["posts","programs"]`) —
   * xem danh sách module ở `PERMISSION_MODULES` trong `src/lib/constants.ts`.
   * `NULL` = toàn quyền (mọi tài khoản tạo trước khi có tính năng phân quyền
   * đều giữ nguyên `NULL` qua migration, tự động không bị khoá quyền truy cập
   * khi nâng cấp) — tài khoản mới tạo qua admin/nguoi-dung luôn có mảng cụ
   * thể, không bao giờ để `NULL`.
   */
  permissions: text("permissions"),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Danh mục bài viết (Tuyển sinh, Sự kiện...) — admin tự thêm/xoá không giới hạn. */
export const categories = pgTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  name: text("name").notNull(),
  /** Bản tiếng Anh của `name` — để trống thì site hiện bản tiếng Việt khi khách chọn EN. */
  nameEn: text("name_en"),
  slug: text("slug").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Bài viết — tin tức, thông báo, sự kiện hiển thị ở /tin-tuc. */
export const posts = pgTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
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
  /** Ghim làm "Thông báo" nổi bật ở khối riêng trên Trang chủ (tách khỏi Tin tức thường). */
  isPinned: integer("is_pinned").notNull().default(0),
  /** Tệp đính kèm (PDF/Word/Excel) — VD quyết định tuyển sinh, biểu mẫu. URL đã lưu qua saveUploadedFile. */
  attachmentUrl: text("attachment_url"),
  /** Tên file gốc để hiển thị link tải (URL lưu đã bị đổi tên thêm timestamp, không đẹp để hiện cho khách). */
  attachmentName: text("attachment_name"),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowText),
});

/** Trang tĩnh có thể chỉnh sửa nội dung qua CMS (Giới thiệu, Liên hệ...). */
export const pages = pgTable("pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  /** Ảnh banner đầu trang — tuỳ chọn, không có thì trang không hiện khối ảnh. */
  coverImageUrl: text("cover_image_url"),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowText),
});

/** Mục media trong thư viện ảnh/video (metadata; file thật lưu ở /public khi dev, S3 khi production). */
export const mediaItems = pgTable("media_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  /** "image" | "video" */
  type: text("type").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Ngành đào tạo — hiển thị ở Trang chủ và /nganh-dao-tao. */
export const programs = pgTable("programs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
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
  /**
   * Học phí dạng chữ tự do, VD "1.840.000đ/tháng" — tuỳ chọn. Để trống thì
   * web hiện "Liên hệ" (không tự bịa số liệu học phí khi trường chưa xác nhận).
   */
  tuition: text("tuition"),
  tuitionEn: text("tuition_en"),
  /**
   * Ảnh minh hoạ ngành (tuỳ chọn) — hiện ở đầu thẻ ngành (Trang chủ, /nganh-dao-tao) và
   * làm nền banner trang chi tiết. Để trống thì thẻ chỉ có khối màu gradient như cũ.
   */
  imageUrl: text("image_url"),
  /** 0 = không hiện ở Trang chủ, 1 = hiện. Nếu không ngành nào featured, Trang chủ tự lấy 6 ngành đầu. */
  featured: integer("featured").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowText),
});

/** Thông tin liên hệ/vận hành chung của site — luôn chỉ có đúng 1 dòng (id "main"). */
export const siteSettings = pgTable("site_settings", {
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
  /** Ảnh nền mặc định cho banner đầu trang con (PageHero) khi trang đó không có ảnh bìa riêng — tuỳ chọn, trống thì dùng nền xanh gradient. */
  pageBannerUrl: text("page_banner_url"),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowText),
});

/** Nội dung chữ ở Trang chủ (Hero, chỉ số, điểm mạnh, quy trình, CTA) — luôn chỉ có đúng 1 dòng (id "main"). */
export const homepageContent = pgTable("homepage_content", {
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
    .default(nowText),
});

/** Mục menu chính của site công khai — danh mục to (parentId null) và danh mục con (parentId trỏ tới 1 danh mục to). */
export const navItems = pgTable("nav_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  label: text("label").notNull(),
  labelEn: text("label_en"),
  href: text("href").notNull(),
  /** Mô tả ngắn 1 dòng — chỉ dùng cho danh mục con, hiện dưới tên mục trong mega menu. Tuỳ chọn. */
  description: text("description"),
  descriptionEn: text("description_en"),
  /** null = danh mục to. Có giá trị = danh mục con thuộc nav_items.id đó. */
  parentId: text("parent_id"),
  /** Chỉ áp dụng cho danh mục to: 1 = hiện ở thanh ngang chính, 0 = nằm trong nút ☰ "Danh mục khác". */
  isPrimary: integer("is_primary").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Danh sách nút liên hệ nhanh nổi góc màn hình (`QuickContactWidget`) —
 * admin tự thêm/sửa/xoá/sắp thứ tự, mỗi mục tự chọn `type` (quyết định icon
 * hiện ra) + `href` riêng (tel:, https://zalo.me/..., link chatbot ngoài...).
 * Trước đây cố định cứng 3 kênh (Hotline/Zalo/Facebook) lấy từ
 * `site_settings` — giờ tách hẳn ra đây để linh hoạt thêm kênh mới (Tin
 * nhắn, ChatbotAI...) mà không phải sửa code.
 */
export const quickContacts = pgTable("quick_contacts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  /** "hotline" | "zalo" | "facebook" | "message" | "chatbot" | "custom" — quyết định icon hiển thị. */
  type: text("type").notNull(),
  label: text("label").notNull(),
  labelEn: text("label_en"),
  /** Link đầy đủ — VD "tel:19006868", "https://zalo.me/...". Nhập nguyên href, không tự ghép. */
  href: text("href").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Email đăng ký nhận bản tin — form ở Footer, admin xem/xuất danh sách qua admin/dang-ky-nhan-tin. */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Đối tác hiển thị ở dải logo/tên Trang chủ — sortOrder do admin tự nhập để sắp vị trí. */
export const partners = pgTable("partners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  /** Ảnh logo (tuỳ chọn) — có logo thì dải đối tác hiện logo, không có thì hiện tên chữ. */
  logoUrl: text("logo_url"),
  /** Website của đối tác (tuỳ chọn) — có thì bấm vào logo/tên mở tab mới. */
  websiteUrl: text("website_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Ảnh trong khối "Thư viện" dạng bento ở Trang chủ. */
export const galleryItems = pgTable("gallery_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  imageUrl: text("image_url").notNull(),
  /** Link video (VD YouTube) — tuỳ chọn. Có giá trị thì `imageUrl` đóng vai trò ảnh bìa/thumbnail, click mở video ở tab mới. */
  videoUrl: text("video_url"),
  caption: text("caption").notNull(),
  captionEn: text("caption_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Ảnh banner Hero Trang chủ — nhiều ảnh xoay vòng (thay cho 1 ảnh cố định
 * `homepage_content.hero_image_url` trước đây). Nếu bảng này rỗng, Trang chủ
 * tự fallback về `heroImageUrl` cũ — không bắt buộc admin phải thêm ngay.
 */
export const heroBanners = pgTable("hero_banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  captionEn: text("caption_en"),
  /** Bấm vào banner điều hướng tới đâu — tuỳ chọn, để trống thì banner không phải link. */
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Danh mục Học hàm / Học vị / Chức vụ cho Giảng viên — 3 danh sách tách rời
 * bằng cột `type`, quản lý chung 1 trang admin (`admin/danh-hieu`) để thêm
 * 1 lần, chọn qua dropdown khi tạo giảng viên thay vì gõ tay tự do (tránh
 * "ThS" và "Th.S" cùng tồn tại). Chỉ dùng trong admin — không cần lớp data
 * layer riêng (theo đúng quy ước admin gọi `db` trực tiếp).
 */
export const facultyAttributes = pgTable("faculty_attributes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  /** "academic_rank" (Học hàm) | "degree" (Học vị) | "position" (Chức vụ). */
  type: text("type").notNull(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Khoa/Bộ môn — danh mục quản lý giảng viên theo đơn vị, giống `categories` cho bài viết. */
export const departments = pgTable("departments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Đội ngũ giảng viên hiển thị ở Trang chủ và trang chi tiết /doi-ngu-giang-vien/[slug]. */
export const faculty = pgTable("faculty", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  /**
   * Dùng cho URL trang chi tiết — tự sinh từ tên, không bắt buộc nhập tay.
   * Nullable (thay vì notNull như slug các bảng khác) vì hồi còn SQLite cột này
   * được thêm khi bảng đã có dữ liệu (không ALTER TABLE thêm NOT NULL được).
   * Action luôn tự sinh + set slug lúc tạo mới, nên thực tế luôn có giá trị.
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
   * cần ghi thêm nơi đào tạo). Giữ lại cột này (rỗng) cho khớp dữ liệu cũ.
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
    .default(nowText),
});

/** Sự kiện — lịch sự kiện riêng ở /su-kien, khác Tin tức (không có trạng thái nháp/đăng). */
export const events = pgTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  /** Nullable dù logic luôn tự sinh khi tạo mới — lý do lịch sử giống `faculty.slug` (thêm cột hồi còn SQLite). */
  slug: text("slug").unique(),
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
    .default(nowText),
});

/** Tin nhắn gửi từ form Liên hệ công khai — admin xem/đổi trạng thái qua admin/lien-he. */
export const contactMessages = pgTable("contact_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  message: text("message").notNull(),
  /** "new" (mới) | "read" (đã xem) */
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Câu hỏi thường gặp — hiện ở /faq, admin sắp xếp qua sortOrder. */
export const faqs = pgTable("faqs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  question: text("question").notNull(),
  questionEn: text("question_en"),
  answer: text("answer").notNull(),
  answerEn: text("answer_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/** Đánh giá/cảm nhận của cựu sinh viên hiển thị ở Trang chủ. */
export const testimonials = pgTable("testimonials", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  quote: text("quote").notNull(),
  quoteEn: text("quote_en"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  roleEn: text("role_en"),
  avatarUrl: text("avatar_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Thông tin tuyển sinh hiển thị ở /tuyen-sinh — 3 danh sách tách bằng cột
 * `type` (cùng pattern discriminator với `faculty_attributes`/`quick_contacts`),
 * quản lý chung 1 trang `admin/thong-tin-tuyen-sinh`:
 *   - "timeline": mốc thời gian tuyển sinh (`meta` = thời gian, VD "01/03 – 30/06/2026")
 *   - "method":   phương thức xét tuyển
 *   - "document": hồ sơ cần chuẩn bị (thường chỉ cần `title`)
 */
export const admissionItems = pgTable("admission_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  detail: text("detail"),
  detailEn: text("detail_en"),
  meta: text("meta"),
  metaEn: text("meta_en"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Cột mốc phát triển của trường — dòng thời gian ở /gioi-thieu (kiểu "Những
 * cột mốc" của VinUni: chọn năm → hiện các mốc trong năm). Quản lý qua
 * admin/cot-moc. Nội dung do trường tự nhập — seed KHÔNG tạo sẵn mốc nào để
 * tránh bịa lịch sử trường (chỉ `npm run demo:load` tạo vài "Mốc mẫu").
 */
export const milestones = pgTable("milestones", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
  year: integer("year").notNull(),
  /** Thời điểm trong năm, tuỳ chọn — VD "Tháng 9". */
  period: text("period"),
  periodEn: text("period_en"),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  imageUrl: text("image_url"),
  /** Thứ tự trong cùng 1 năm (số nhỏ hiện trước). */
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(nowText),
});

/**
 * Ảnh banner riêng cho từng trang con (PageHero) — 1 dòng / 1 trang, `key` là mã
 * trang trong `PAGE_BANNER_SLOTS` (src/lib/constants.ts, VD "tin-tuc"). Quản lý qua
 * admin/banner-trang-con; dòng tạo khi admin lưu lần đầu. Trang tĩnh (Giới thiệu,
 * Liên hệ, Công khai…) KHÔNG lưu ở đây mà dùng `pages.cover_image_url` sẵn có.
 */
export const pageBanners = pgTable("page_banners", {
  key: text("key").primaryKey(),
  imageUrl: text("image_url"),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowText),
});

/** Hồ sơ đăng ký xét tuyển gửi từ form công khai trên website. */
export const admissionSubmissions = pgTable("admission_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  seq: seq(),
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
    .default(nowText),
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
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AdmissionItem = typeof admissionItems.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type PageBanner = typeof pageBanners.$inferSelect;
