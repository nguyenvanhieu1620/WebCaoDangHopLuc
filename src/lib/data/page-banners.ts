import { cache } from "react";
import { db } from "@/lib/db";
import type { PageBannerKey } from "@/lib/constants";

/**
 * Ảnh banner riêng của từng trang con (admin/banner-trang-con), dạng map key → url.
 * Bọc `cache()`: mọi `PageHero` trong 1 request dùng chung đúng 1 query (bảng chỉ
 * vài chục dòng nên đọc hết 1 lần, không query theo từng key).
 */
export const getPageBannerMap = cache(async function getPageBannerMap(): Promise<Map<string, string>> {
  const rows = await db.query.pageBanners.findMany();
  return new Map(rows.filter((r) => r.imageUrl).map((r) => [r.key, r.imageUrl as string]));
});

/** Ảnh banner riêng của 1 trang con — `null` nếu chưa đặt (PageHero rơi về ảnh mặc định). */
export async function getPageBanner(key: PageBannerKey): Promise<string | null> {
  return (await getPageBannerMap()).get(key) ?? null;
}
