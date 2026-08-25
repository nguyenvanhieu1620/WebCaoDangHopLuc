import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { QuickContact } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Danh sách nút liên hệ nhanh nổi góc màn hình — quản lý qua admin/lien-he-nhanh. */
export async function getQuickContacts(): Promise<QuickContact[]> {
  const [rows, locale] = await Promise.all([
    db.query.quickContacts.findMany({ orderBy: asc(schema.quickContacts.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((r) => ({ ...r, label: pickLocale(r.label, r.labelEn, locale) }));
}
