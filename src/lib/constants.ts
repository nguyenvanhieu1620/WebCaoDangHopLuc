/**
 * Cấu hình trung tâm cho toàn site — chỉnh ở đây sẽ áp dụng khắp nơi.
 * Đồng bộ nội dung từ bản thiết kế Claude Design (SiteHeader.dc.html, SiteFooter.dc.html...).
 */

/**
 * Chỉ còn tên/tagline hiển thị (không đổi qua CMS). Thông tin liên hệ
 * (hotline/email/địa chỉ/banner/mạng xã hội) đã chuyển sang bảng
 * `site_settings` — lấy qua `src/lib/data/site-settings.ts`.
 */
export const SITE = {
  name: "HỢP LỰC",
  fullName: "Trường Cao đẳng Y Dược Hợp Lực",
  tagline: "Medical Pharmacy College",
};

/**
 * Domain thật để sinh sitemap/robots/Open Graph — đọc từ biến môi trường
 * `NEXT_PUBLIC_SITE_URL` (xem `.env.example`). Chưa cấu hình thì tạm dùng
 * localhost, KHÔNG đúng cho production — nhớ set biến này khi deploy thật.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

/**
 * Menu chính của website công khai giờ quản lý qua bảng `nav_items` trong DB
 * (CMS admin/menu) — KHÔNG còn mảng tĩnh ở đây. Lấy dữ liệu qua
 * src/lib/data/nav.ts (page/component không gọi `db` trực tiếp).
 */

/**
 * Menu sidebar khu vực quản trị. Mỗi mục là 1 THỰC THỂ (không phải 1 super-
 * category chung chung như "Nội dung") — mục nào có từ 2 trang quản lý liên
 * quan trở lên (VD Bài viết + Danh mục) thì gom vào `children` thành khối
 * thu gọn/mở rộng được; chỉ 1 trang thì để thẳng `href`, không bọc children
 * cho khỏi thừa 1 lượt bấm. Theo đúng mẫu "phần nào ra phần đấy" người dùng
 * yêu cầu — xem CLAUDE.md mục 5 "Cấu trúc lại Giảng viên" + "Sidebar admin
 * theo khối thực thể".
 */
export type AdminNavLeaf = { key: string; label: string; href: string };
/**
 * Entity có `href` = link thẳng (không có children); entity có `children` = khối thu gọn (header chỉ để bấm mở/đóng, không phải link).
 * `section` chỉ là nhãn nhóm hiển thị trong sidebar (tiêu đề nhỏ phía trên các entity liền kề cùng nhóm) — không ảnh hưởng phân quyền.
 */
export type AdminNavEntity =
  | (AdminNavLeaf & { section?: string; children?: undefined })
  | { key: string; label: string; section?: string; href?: undefined; children: AdminNavLeaf[] };

export const ADMIN_NAV: AdminNavEntity[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  {
    key: "posts",
    label: "Bài viết",
    section: "Nội dung",
    children: [
      { key: "posts-list", label: "Bài viết", href: "/admin/bai-viet" },
      { key: "posts-categories", label: "Danh mục", href: "/admin/danh-muc" },
    ],
  },
  { key: "events", label: "Sự kiện", href: "/admin/su-kien", section: "Nội dung" },
  { key: "faq", label: "Câu hỏi thường gặp", href: "/admin/faq", section: "Nội dung" },
  { key: "pages", label: "Trang tĩnh", href: "/admin/trang-tinh", section: "Nội dung" },
  { key: "media", label: "Thư viện media", href: "/admin/media", section: "Nội dung" },
  { key: "programs", label: "Ngành đào tạo", href: "/admin/nganh-dao-tao", section: "Đào tạo" },
  {
    key: "faculty",
    label: "Giảng viên",
    section: "Đào tạo",
    children: [
      { key: "faculty-list", label: "Đội ngũ giảng viên", href: "/admin/giang-vien" },
      { key: "departments", label: "Khoa / Bộ môn", href: "/admin/khoa" },
      { key: "faculty-attributes", label: "Học hàm / Học vị / Chức vụ", href: "/admin/danh-hieu" },
    ],
  },
  {
    key: "admissions-contact",
    label: "Tuyển sinh & Liên hệ",
    section: "Tuyển sinh",
    children: [
      { key: "admissions", label: "Đăng ký tuyển sinh", href: "/admin/tuyen-sinh" },
      { key: "admission-info", label: "Thông tin tuyển sinh", href: "/admin/thong-tin-tuyen-sinh" },
      { key: "contact-messages", label: "Tin nhắn liên hệ", href: "/admin/lien-he" },
      { key: "quick-contacts", label: "Liên hệ nhanh", href: "/admin/lien-he-nhanh" },
      { key: "newsletter", label: "Đăng ký nhận tin", href: "/admin/dang-ky-nhan-tin" },
    ],
  },
  {
    key: "homepage",
    label: "Trang chủ",
    section: "Giao diện",
    children: [
      { key: "hero-banner", label: "Banner Trang chủ", href: "/admin/banner-trang-chu" },
      { key: "gallery", label: "Thư viện ảnh Trang chủ", href: "/admin/thu-vien-trang-chu" },
      { key: "homepage-content", label: "Nội dung Trang chủ", href: "/admin/trang-chu" },
    ],
  },
  { key: "menu", label: "Menu chính", href: "/admin/menu", section: "Giao diện" },
  { key: "partners", label: "Đối tác", href: "/admin/doi-tac", section: "Giao diện" },
  { key: "testimonials", label: "Đánh giá cựu SV", href: "/admin/danh-gia", section: "Giao diện" },
  { key: "site-settings", label: "Cài đặt chung", href: "/admin/cai-dat", section: "Hệ thống" },
  { key: "users", label: "Người dùng", href: "/admin/nguoi-dung", section: "Hệ thống" },
];

/**
 * Danh sách module để tick chọn khi phân quyền 1 tài khoản (xem
 * `admin/nguoi-dung`) — lấy thẳng từ `ADMIN_NAV` (trừ Dashboard, ai đăng
 * nhập cũng thấy) nên luôn khớp 1-1 với sidebar, không cần khai báo trùng.
 */
export const PERMISSION_MODULES: { key: string; label: string }[] = ADMIN_NAV.filter(
  (entity) => entity.key !== "dashboard"
).map((entity) => ({ key: entity.key, label: entity.label }));

/**
 * Danh sách ngành đào tạo giờ quản lý qua bảng `programs` trong DB (CMS
 * admin/nganh-dao-tao) — KHÔNG còn mảng tĩnh ở đây. Lấy dữ liệu qua
 * src/lib/data/programs.ts (page/component không gọi `db` trực tiếp).
 */

/** Gradient màu thẻ ngành — tự xoay vòng theo vị trí, không cần khai báo thủ công. */
export const PROGRAM_GRADIENT_CYCLE = [
  "from-brand-800 to-brand-500", // xanh dương
  "from-[#183A52] to-brand-600", // navy
  "from-accent-700 to-accent-500", // đỏ
] as const;

export function programGradient(index: number): string {
  return PROGRAM_GRADIENT_CYCLE[index % PROGRAM_GRADIENT_CYCLE.length];
}

