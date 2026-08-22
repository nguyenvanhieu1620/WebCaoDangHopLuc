import { db, schema } from "@/lib/db";
import { asc, eq, like } from "drizzle-orm";
import type { Page } from "@/lib/db/schema";

/** Trang tĩnh (nội dung nhập qua admin/trang-tinh) — dùng cho các trang công khai đọc theo slug. */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const page = await db.query.pages.findFirst({
    where: eq(schema.pages.slug, slug),
  });
  return page ?? null;
}

/** Các trang tĩnh có slug bắt đầu bằng 1 tiền tố — dùng cho trang mục lục (VD: "cong-khai-"). */
export async function getPagesBySlugPrefix(prefix: string): Promise<Page[]> {
  return db.query.pages.findMany({
    where: like(schema.pages.slug, `${prefix}%`),
    orderBy: asc(schema.pages.title),
  });
}
