import { db, schema } from "@/lib/db";
import { asc, eq, like } from "drizzle-orm";
import type { Page } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

function localize(p: Page, locale: "vi" | "en"): Page {
  return {
    ...p,
    title: pickLocale(p.title, p.titleEn, locale),
    content: pickLocale(p.content, p.contentEn, locale),
  };
}

/** Trang tĩnh (nội dung nhập qua admin/trang-tinh) — dùng cho các trang công khai đọc theo slug. */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const [page, locale] = await Promise.all([
    db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) }),
    getLocale(),
  ]);
  return page ? localize(page, locale) : null;
}

/** Các trang tĩnh có slug bắt đầu bằng 1 tiền tố — dùng cho trang mục lục (VD: "cong-khai-"). */
export async function getPagesBySlugPrefix(prefix: string): Promise<Page[]> {
  const [rows, locale] = await Promise.all([
    db.query.pages.findMany({
      where: like(schema.pages.slug, `${prefix}%`),
      orderBy: [asc(schema.pages.title), asc(schema.pages.seq)],
    }),
    getLocale(),
  ]);
  return rows.map((p) => localize(p, locale));
}
