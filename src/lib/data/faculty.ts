import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Faculty } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Đội ngũ giảng viên hiển thị ở Trang chủ và /doi-ngu-giang-vien — quản lý qua admin/giang-vien. */
export async function getFacultyList(): Promise<Faculty[]> {
  const [rows, locale] = await Promise.all([
    db.query.faculty.findMany({ orderBy: asc(schema.faculty.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((r) => ({ ...r, role: pickLocale(r.role, r.roleEn, locale) }));
}
