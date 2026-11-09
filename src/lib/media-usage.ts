import { getTableColumns, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type MediaUsage = { label: string; href: string };

// Gồm bản nháp, bản Anh, Markdown, video và tệp đính kèm. Không quét dữ liệu hồ sơ/liên hệ.
const sources = [
  { table: schema.posts, label: "Bài viết", href: "/admin/bai-viet" },
  { table: schema.pages, label: "Trang tĩnh", href: "/admin/trang-tinh" },
  { table: schema.programs, label: "Ngành đào tạo", href: "/admin/nganh-dao-tao" },
  { table: schema.siteSettings, label: "Cài đặt chung", href: "/admin/cai-dat" },
  { table: schema.homepageContent, label: "Nội dung Trang chủ", href: "/admin/trang-chu" },
  { table: schema.navItems, label: "Menu", href: "/admin/menu" },
  { table: schema.quickContacts, label: "Liên hệ nhanh", href: "/admin/lien-he-nhanh" },
  { table: schema.partners, label: "Đối tác", href: "/admin/doi-tac" },
  { table: schema.galleryItems, label: "Thư viện Trang chủ", href: "/admin/thu-vien-trang-chu" },
  { table: schema.heroBanners, label: "Banner Trang chủ", href: "/admin/banner-trang-chu" },
  { table: schema.faculty, label: "Giảng viên", href: "/admin/giang-vien" },
  { table: schema.events, label: "Sự kiện", href: "/admin/su-kien" },
  { table: schema.faqs, label: "Câu hỏi thường gặp", href: "/admin/faq" },
  { table: schema.testimonials, label: "Đánh giá", href: "/admin/danh-gia" },
  { table: schema.admissionItems, label: "Thông tin tuyển sinh", href: "/admin/thong-tin-tuyen-sinh" },
  { table: schema.milestones, label: "Cột mốc", href: "/admin/cot-moc" },
  { table: schema.pageBanners, label: "Banner trang con", href: "/admin/banner-trang-con" },
];

/** Nhận URL trong Markdown/HTML/JSON, cả đường dẫn mã hoá; không nhầm a.png với a.png2. */
export function referencesMedia(value: unknown, url: string): boolean {
  if (typeof value !== "string") return false;
  const decoded = value.replace(/\\\//g, "/").replace(/(?:%[0-9a-f]{2})+/gi, (part) => {
    try { return decodeURIComponent(part); } catch { return part; }
  });
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?=$|[\\s"'<>\\[\\](){}?,;#])`).test(decoded);
}

/** Một lượt truy vấn cho mỗi nhóm nội dung, dùng chung cho cả trang thư viện và action xoá. */
export async function getMediaUsage(urls: string[]): Promise<Map<string, MediaUsage[]>> {
  const result = new Map(urls.map((url) => [url, [] as MediaUsage[]]));
  if (!urls.length) return result;
  await Promise.all(sources.map(async ({ table, label, href }) => {
    const columns = Object.values(getTableColumns(table)).filter((c) => c.dataType === "string");
    // Lọc ứng viên tại DB trước; kiểm tra ranh giới URL bằng referencesMedia ở dưới.
    const rows = await db.select().from(table).where(sql.join(
      columns.map((column) => sql`(position('uploads' in lower(${column})) > 0 or position('%' in ${column}) > 0)`), sql` or `
    ));
    for (const url of urls) {
      if (rows.some((row) => Object.values(row).some((value) => referencesMedia(value, url)))) {
        result.get(url)!.push({ label, href });
      }
    }
  }));
  // Thứ tự hiển thị ổn định dù các truy vấn kết thúc khác nhau.
  for (const usages of result.values()) usages.sort((a, b) => a.href.localeCompare(b.href));
  return result;
}
