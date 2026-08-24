import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Category } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Danh mục bài viết — quản lý qua admin/bai-viet. */
export async function getCategories(): Promise<Category[]> {
  const [rows, locale] = await Promise.all([
    db.query.categories.findMany({ orderBy: asc(schema.categories.name) }),
    getLocale(),
  ]);
  return rows.map((r) => ({ ...r, name: pickLocale(r.name, r.nameEn, locale) }));
}
