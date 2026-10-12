import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Department } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Khoa/Bộ môn — quản lý qua admin/khoa, dùng để nhóm giảng viên ở /doi-ngu-giang-vien. */
export async function getDepartments(): Promise<Department[]> {
  const [rows, locale] = await Promise.all([
    db.query.departments.findMany({ orderBy: [asc(schema.departments.sortOrder), asc(schema.departments.seq)] }),
    getLocale(),
  ]);
  return rows.map((d) => ({ ...d, name: pickLocale(d.name, d.nameEn, locale) }));
}
