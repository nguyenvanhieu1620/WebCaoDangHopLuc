"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function updateSiteSettingsAction(formData: FormData) {
  const hotline = String(formData.get("hotline") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const announcement = String(formData.get("announcement") || "").trim();
  const facebookUrl = String(formData.get("facebookUrl") || "").trim() || "#";
  const zaloUrl = String(formData.get("zaloUrl") || "").trim() || "#";
  const youtubeUrl = String(formData.get("youtubeUrl") || "").trim() || "#";

  if (!hotline || !email || !address || !announcement) return;

  await db
    .update(schema.siteSettings)
    .set({
      hotline,
      email,
      address,
      announcement,
      facebookUrl,
      zaloUrl,
      youtubeUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.siteSettings.id, "main"));

  revalidatePath("/", "layout");
  revalidatePath("/admin/cai-dat");
}
