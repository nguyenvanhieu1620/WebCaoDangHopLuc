"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { resolveImageUrl } from "@/lib/media";
import { PAGE_BANNER_SLOTS } from "@/lib/constants";
import { staticPageHref } from "@/lib/utils";

/**
 * Lưu banner của 1 thẻ ở admin/banner-trang-con. Mỗi thẻ là 1 form riêng gửi
 * `kind` + `target`:
 * - `default` — ảnh mặc định chung (`site_settings.page_banner_url`);
 * - `slot`    — trang chức năng trong `PAGE_BANNER_SLOTS` (bảng `page_banners`);
 * - `page`    — trang tĩnh có route công khai (`pages.cover_image_url`, cũng là ảnh
 *   bìa sửa được ở admin/trang-tinh — 1 nguồn duy nhất, không lưu trùng 2 nơi).
 * Ảnh: file mới tải lên > ảnh chọn từ thư viện > giữ ảnh cũ; tick "Gỡ" thì bỏ.
 */
export async function savePageBannerAction(formData: FormData) {
  await requirePermission("page-banners");
  const kind = String(formData.get("kind") || "");
  const target = String(formData.get("target") || "").trim();
  const remove = formData.get("remove") === "on";
  const pick = (current: string | null) =>
    remove ? Promise.resolve(null) : resolveImageUrl(formData, "image", "imageExisting", current);

  if (kind === "default") {
    const current = await db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, "main") });
    if (!current) return;
    await db
      .update(schema.siteSettings)
      .set({ pageBannerUrl: await pick(current.pageBannerUrl), updatedAt: new Date().toISOString() })
      .where(eq(schema.siteSettings.id, "main"));
  } else if (kind === "slot") {
    if (!PAGE_BANNER_SLOTS.some((s) => s.key === target)) return;
    const current = await db.query.pageBanners.findFirst({ where: eq(schema.pageBanners.key, target) });
    const imageUrl = await pick(current?.imageUrl ?? null);
    const updatedAt = new Date().toISOString();
    await db
      .insert(schema.pageBanners)
      .values({ key: target, imageUrl, updatedAt })
      .onConflictDoUpdate({ target: schema.pageBanners.key, set: { imageUrl, updatedAt } });
  } else if (kind === "page") {
    const page = await db.query.pages.findFirst({ where: eq(schema.pages.id, target) });
    if (!page || !staticPageHref(page.slug)) return;
    await db
      .update(schema.pages)
      .set({ coverImageUrl: await pick(page.coverImageUrl), updatedAt: new Date().toISOString() })
      .where(eq(schema.pages.id, target));
    revalidatePath("/admin/trang-tinh");
  } else {
    return;
  }

  // Banner dùng ở hầu hết trang con (ảnh mặc định ảnh hưởng mọi trang) → làm mới cả cây.
  revalidatePath("/", "layout");
  // Trang cấu hình: ở lại trang, báo đúng thẻ vừa lưu + cuộn về thẻ đó.
  redirect(`/admin/banner-trang-con?saved=${encodeURIComponent(`${kind}:${target}`)}#banner-${kind}-${target || "main"}`);
}
