"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { resolveImageUrl } from "@/lib/media";

export async function updateSiteSettingsAction(formData: FormData) {
  await requirePermission("site-settings");
  const hotline = String(formData.get("hotline") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const announcement = String(formData.get("announcement") || "").trim();
  const announcementEn = String(formData.get("announcementEn") || "").trim();
  const facebookUrl = String(formData.get("facebookUrl") || "").trim() || "#";
  const zaloUrl = String(formData.get("zaloUrl") || "").trim() || "#";
  const youtubeUrl = String(formData.get("youtubeUrl") || "").trim() || "#";
  const lmsUrl = String(formData.get("lmsUrl") || "").trim() || "#";

  if (!hotline || !email || !address || !announcement) return;

  const current = await db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, "main") });
  const pageBannerUrl =
    formData.get("removePageBanner") === "on"
      ? null
      : await resolveImageUrl(formData, "pageBanner", "pageBannerExisting", current?.pageBannerUrl ?? null);

  const [announcementEnFinal] = await autoFillTranslations([
    { vi: announcement, en: announcementEn },
  ]);

  await db
    .update(schema.siteSettings)
    .set({
      hotline,
      email,
      address,
      announcement,
      announcementEn: announcementEnFinal || null,
      facebookUrl,
      zaloUrl,
      youtubeUrl,
      lmsUrl,
      pageBannerUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.siteSettings.id, "main"));

  revalidatePath("/", "layout");
  revalidatePath("/lms");
  revalidatePath("/admin/cai-dat");

  redirect("/admin/cai-dat?saved=1");
}
