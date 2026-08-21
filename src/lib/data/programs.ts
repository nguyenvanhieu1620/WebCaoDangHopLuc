import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import type { Program } from "@/lib/db/schema";

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
  return db.query.programs.findMany({
    orderBy: asc(schema.programs.createdAt),
  });
}

/** Lấy danh sách ngành hiển thị ở Trang chủ (ưu tiên featured, fallback 6 ngành đầu). */
export async function getFeaturedPrograms(): Promise<Program[]> {
  const all = await getPrograms();
  const featured = all.filter((p) => p.featured === 1);
  return featured.length > 0 ? featured : all.slice(0, 6);
}

/** Lấy 1 ngành theo slug — dùng cho trang chi tiết. Trả về null nếu không tìm thấy. */
export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const program = await db.query.programs.findFirst({
    where: eq(schema.programs.slug, slug),
  });
  return program ?? null;
}

/** Lấy toàn bộ slug — dùng cho generateStaticParams (Next.js static generation). */
export async function getAllProgramSlugs(): Promise<string[]> {
  const all = await getPrograms();
  return all.map((p) => p.slug);
}
