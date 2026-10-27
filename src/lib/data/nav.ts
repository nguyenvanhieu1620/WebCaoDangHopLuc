import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";
import { safeHref } from "@/lib/safe-href";

export type NavNode = {
  id: string;
  label: string;
  href: string;
  /** Mô tả ngắn 1 dòng (chỉ danh mục con) — hiện trong mega menu. */
  description: string | null;
  children: NavNode[];
};

/**
 * Cây menu chính của site công khai — quản lý qua admin/menu. Danh mục to
 * (parentId null) tách thành `primary` (hiện ở thanh ngang chính) và
 * `secondary` (nằm trong nút ☰ "Danh mục khác") theo cột `isPrimary`.
 */
export async function getNavTree(): Promise<{ primary: NavNode[]; secondary: NavNode[] }> {
  const [rows, locale] = await Promise.all([
    db.query.navItems.findMany({ orderBy: [asc(schema.navItems.sortOrder), asc(schema.navItems.seq)] }),
    getLocale(),
  ]);

  type Row = (typeof rows)[number];
  const label = (row: Row) => pickLocale(row.label, row.labelEn, locale);
  const description = (row: Row) => (row.description ? pickLocale(row.description, row.descriptionEn, locale) : null);
  const toNode = (row: Row): NavNode => ({
    id: row.id,
    label: label(row),
    href: safeHref(row.href) ?? "#",
    description: description(row),
    children: rows
      .filter((r) => r.parentId === row.id)
      .map((r) => ({ id: r.id, label: label(r), href: safeHref(r.href) ?? "#", description: description(r), children: [] })),
  });

  const topLevel = rows.filter((r) => !r.parentId);
  return {
    primary: topLevel.filter((r) => r.isPrimary === 1).map(toNode),
    secondary: topLevel.filter((r) => r.isPrimary !== 1).map(toNode),
  };
}
