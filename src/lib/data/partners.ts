import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Partner } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Đối tác hiển thị ở dải Trang chủ — quản lý qua admin/doi-tac. */
export async function getPartners(): Promise<Partner[]> {
  const [rows, locale] = await Promise.all([
    db.query.partners.findMany({ orderBy: asc(schema.partners.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((r) => ({ ...r, name: pickLocale(r.name, r.nameEn, locale) }));
}
