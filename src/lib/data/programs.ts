import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import type { Program } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

function localize(p: Program, locale: "vi" | "en"): Program {
  return {
    ...p,
    name: pickLocale(p.name, p.nameEn, locale),
    summary: pickLocale(p.summary, p.summaryEn, locale),
    content: p.content ? pickLocale(p.content, p.contentEn, locale) : p.content,
  };
}

/**
 * LỚP TRUY XUẤT DỮ LIỆU (data layer) — đây là điểm mấu chốt để base "vững" khi
 * phát triển lên Giai đoạn 2 theo SRS.
 *
 * Đọc từ bảng `programs` trong DB (trước đây đọc từ mảng tĩnh PROGRAMS trong
 * constants.ts — đã chuyển hẳn sang DB để admin tự quản lý qua CMS).
 *
 * Mọi trang (page.tsx) chỉ được phép lấy dữ liệu ngành đào tạo qua các hàm ở
 * đây — KHÔNG gọi `db` trực tiếp trong page/component, để đảm bảo khi đổi
 * nguồn dữ liệu (VD: PostgreSQL ở Giai đoạn 2), chỉ phải sửa đúng 1 file này.
 */

/** Lấy toàn bộ danh sách ngành đào tạo, theo đúng thứ tự tạo. */
export async function getPrograms(): Promise<Program[]> {
  const [rows, locale] = await Promise.all([
    db.query.programs.findMany({ orderBy: asc(schema.programs.createdAt) }),
    getLocale(),
  ]);
  return rows.map((p) => localize(p, locale));
}

/** Lấy danh sách ngành hiển thị ở Trang chủ (ưu tiên featured, fallback 6 ngành đầu). */
export async function getFeaturedPrograms(): Promise<Program[]> {
  const all = await getPrograms();
  const featured = all.filter((p) => p.featured === 1);
  return featured.length > 0 ? featured : all.slice(0, 6);
}

/** Lấy 1 ngành theo slug — dùng cho trang chi tiết. Trả về null nếu không tìm thấy. */
export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const [program, locale] = await Promise.all([
    db.query.programs.findFirst({ where: eq(schema.programs.slug, slug) }),
    getLocale(),
  ]);
  return program ? localize(program, locale) : null;
}

/**
 * Lấy toàn bộ slug — dùng cho generateStaticParams (Next.js static generation).
 * Cố ý KHÔNG gọi getPrograms()/getLocale(): generateStaticParams chạy lúc
 * build, không có request/cookie — gọi cookies() ở đó sẽ lỗi. Slug cũng
 * không cần resolve theo ngôn ngữ (không đổi giữa vi/en).
 */
export async function getAllProgramSlugs(): Promise<string[]> {
  const rows = await db.query.programs.findMany({ columns: { slug: true } });
  return rows.map((p) => p.slug);
}
