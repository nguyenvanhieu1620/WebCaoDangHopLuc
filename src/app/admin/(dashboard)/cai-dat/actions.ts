"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";

export async function updateSiteSettingsAction(formData: FormData) {
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
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.siteSettings.id, "main"));

  revalidatePath("/", "layout");
  revalidatePath("/lms");
  revalidatePath("/admin/cai-dat");
}
