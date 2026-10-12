import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { HeroBanner } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Ảnh banner Hero Trang chủ (nhiều ảnh xoay vòng) — quản lý qua admin/banner-trang-chu. */
export async function getHeroBanners(): Promise<HeroBanner[]> {
  const [rows, locale] = await Promise.all([
    db.query.heroBanners.findMany({ orderBy: [asc(schema.heroBanners.sortOrder), asc(schema.heroBanners.seq)] }),
    getLocale(),
  ]);
  return rows.map((b) => ({
    ...b,
    caption: b.caption ? pickLocale(b.caption, b.captionEn, locale) : b.caption,
  }));
}
