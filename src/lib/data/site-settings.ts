import { cache } from "react";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { SiteSettings } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";

/**
 * Thông tin liên hệ/vận hành chung của site (hotline, email, địa chỉ, banner
 * thông báo, link mạng xã hội) — quản lý qua admin/cai-dat, luôn chỉ 1 dòng
 * duy nhất trong DB (id "main"). Seed đảm bảo dòng này luôn tồn tại.
 * Bọc `cache()` — layout, trang và PageHero cùng gọi trong 1 request chỉ tốn 1 query.
 */
export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettings> {
  const [settings, locale] = await Promise.all([
    db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, "main") }),
    getLocale(),
  ]);
  if (!settings) {
    throw new Error(
      "Chưa có dữ liệu site_settings — chạy `npm run db:seed` trước."
    );
  }
  // Link ngoài luôn qua normalizeExternalUrl — giá trị cũ lỡ lưu sai ("#https://…", thiếu https://)
  // vẫn bấm được; không phải link hợp lệ thì về "#" (mọi nơi hiển thị đã ẩn nút khi là "#").
  const link = (value: string) => normalizeExternalUrl(value) ?? "#";
  return {
    ...settings,
    announcement: pickLocale(settings.announcement, settings.announcementEn, locale),
    facebookUrl: link(settings.facebookUrl),
    zaloUrl: normalizeZaloUrl(settings.zaloUrl) ?? "#",
    youtubeUrl: link(settings.youtubeUrl),
    lmsUrl: link(settings.lmsUrl),
  };
});
