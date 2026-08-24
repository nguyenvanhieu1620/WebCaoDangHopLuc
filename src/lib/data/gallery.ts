import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { GalleryItem } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Ảnh khối "Thư viện" bento ở Trang chủ — quản lý qua admin/thu-vien-trang-chu. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const [rows, locale] = await Promise.all([
    db.query.galleryItems.findMany({ orderBy: asc(schema.galleryItems.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((r) => ({ ...r, caption: pickLocale(r.caption, r.captionEn, locale) }));
}
