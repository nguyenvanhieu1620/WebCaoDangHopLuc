import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { GalleryItem } from "@/lib/db/schema";

/** Ảnh khối "Thư viện" bento ở Trang chủ — quản lý qua admin/thu-vien-trang-chu. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  return db.query.galleryItems.findMany({
    orderBy: asc(schema.galleryItems.sortOrder),
  });
}
