"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl, resolveVideoUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { safeHref } from "@/lib/safe-href";

export async function upsertHeroBannerAction(formData: FormData) {
  await requirePermission("homepage");
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const rawLink = String(formData.get("linkUrl") || "").trim();
  const linkUrl = rawLink ? safeHref(rawLink) : null;
  if (rawLink && !linkUrl) return;
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const captionEn = String(formData.get("captionEn") || "").trim();

  const current = id
    ? await db.query.heroBanners.findFirst({ where: eq(schema.heroBanners.id, id) })
    : null;
  const imageUrl = await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null);

  if (!imageUrl) return;
  // Video nền: chỉ file MP4/WEBM của web (tải lên hoặc chọn trong Thư viện media) — video nền không nhúng YouTube.
  const videoUrl = await resolveVideoUrl(formData, "video", "videoExisting");

  const [captionEnFinal] = await autoFillTranslations([{ vi: caption, en: captionEn }]);

  const values = {
    caption: caption || null,
    captionEn: captionEnFinal || null,
    linkUrl: linkUrl || null,
    sortOrder,
    imageUrl,
    videoUrl,
  };

  if (id) {
    await db.update(schema.heroBanners).set(values).where(eq(schema.heroBanners.id, id));
  } else {
    await db.insert(schema.heroBanners).values(values);
  }

  revalidatePath("/admin/banner-trang-chu");
  revalidatePath("/");

  redirect("/admin/banner-trang-chu?saved=1");
}

export async function deleteHeroBannerAction(bannerId: string) {
  await requirePermission("homepage");
  await db.delete(schema.heroBanners).where(eq(schema.heroBanners.id, bannerId));
  revalidatePath("/admin/banner-trang-chu");
  revalidatePath("/");
}
