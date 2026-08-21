import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { SiteSettings } from "@/lib/db/schema";

/**
 * Thông tin liên hệ/vận hành chung của site (hotline, email, địa chỉ, banner
 * thông báo, link mạng xã hội) — quản lý qua admin/cai-dat, luôn chỉ 1 dòng
 * duy nhất trong DB (id "main"). Seed đảm bảo dòng này luôn tồn tại.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await db.query.siteSettings.findFirst({
    where: eq(schema.siteSettings.id, "main"),
  });
  if (!settings) {
    throw new Error(
      "Chưa có dữ liệu site_settings — chạy `npm run db:seed` trước."
    );
  }
  return settings;
}
