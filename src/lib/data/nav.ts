import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import { getLocale, pickLocale } from "@/lib/locale";

export type NavNode = {
  id: string;
  label: string;
  href: string;
  children: NavNode[];
};

/**
 * Cây menu chính của site công khai — quản lý qua admin/menu. Danh mục to
 * (parentId null) tách thành `primary` (hiện ở thanh ngang chính) và
 * `secondary` (nằm trong nút ☰ "Danh mục khác") theo cột `isPrimary`.
 */
export async function getNavTree(): Promise<{ primary: NavNode[]; secondary: NavNode[] }> {
  const [rows, locale] = await Promise.all([
    db.query.navItems.findMany({ orderBy: asc(schema.navItems.sortOrder) }),
    getLocale(),
  ]);

  const label = (row: (typeof rows)[number]) => pickLocale(row.label, row.labelEn, locale);
  const toNode = (row: (typeof rows)[number]): NavNode => ({
    id: row.id,
    label: label(row),
    href: row.href,
    children: rows
      .filter((r) => r.parentId === row.id)
      .map((r) => ({ id: r.id, label: label(r), href: r.href, children: [] })),
  });

  const topLevel = rows.filter((r) => !r.parentId);
  return {
    primary: topLevel.filter((r) => r.isPrimary === 1).map(toNode),
    secondary: topLevel.filter((r) => r.isPrimary !== 1).map(toNode),
  };
}
