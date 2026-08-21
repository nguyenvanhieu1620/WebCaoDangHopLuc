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
 * Menu chính của website công khai giờ quản lý qua bảng `nav_items` trong DB
 * (CMS admin/menu) — KHÔNG còn mảng tĩnh ở đây. Lấy dữ liệu qua
 * src/lib/data/nav.ts (page/component không gọi `db` trực tiếp).
 */

export type AdminNavGroup = {
  label: string;
  items: { key: string; label: string; href: string }[];
};

/** Menu sidebar khu vực quản trị — khớp với AdminSidebar.dc.html gốc. */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Tổng quan",
    items: [{ key: "dashboard", label: "Dashboard", href: "/admin" }],
  },
  {
    label: "Nội dung",
    items: [
      { key: "posts", label: "Bài viết", href: "/admin/bai-viet" },
      { key: "menu", label: "Menu chính", href: "/admin/menu" },
      { key: "programs", label: "Ngành đào tạo", href: "/admin/nganh-dao-tao" },
      { key: "partners", label: "Đối tác", href: "/admin/doi-tac" },
      { key: "faculty", label: "Đội ngũ giảng viên", href: "/admin/giang-vien" },
      { key: "testimonials", label: "Đánh giá cựu SV", href: "/admin/danh-gia" },
      { key: "gallery", label: "Thư viện ảnh Trang chủ", href: "/admin/thu-vien-trang-chu" },
      { key: "media", label: "Thư viện media", href: "/admin/media" },
      { key: "pages", label: "Trang tĩnh", href: "/admin/trang-tinh" },
    ],
  },
  {
    label: "Tuyển sinh",
    items: [
      {
        key: "admissions",
        label: "Đăng ký tuyển sinh",
        href: "/admin/tuyen-sinh",
      },
    ],
  },
  {
    label: "Cấu hình",
    items: [
      { key: "site-settings", label: "Cài đặt chung", href: "/admin/cai-dat" },
      { key: "homepage", label: "Nội dung Trang chủ", href: "/admin/trang-chu" },
    ],
  },
];

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

