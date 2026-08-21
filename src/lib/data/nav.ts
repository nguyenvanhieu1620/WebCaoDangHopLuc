import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";

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
  const rows = await db.query.navItems.findMany({
    orderBy: asc(schema.navItems.sortOrder),
  });

  const toNode = (row: (typeof rows)[number]): NavNode => ({
    id: row.id,
    label: row.label,
    href: row.href,
    children: rows
      .filter((r) => r.parentId === row.id)
      .map((r) => ({ id: r.id, label: r.label, href: r.href, children: [] })),
  });

  const topLevel = rows.filter((r) => !r.parentId);
  return {
    primary: topLevel.filter((r) => r.isPrimary === 1).map(toNode),
    secondary: topLevel.filter((r) => r.isPrimary !== 1).map(toNode),
  };
}
