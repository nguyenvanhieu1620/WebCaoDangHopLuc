"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl, resolveVideoUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertGalleryItemAction(formData: FormData) {
  await requirePermission("homepage");
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const captionEn = String(formData.get("captionEn") || "").trim();

  if (!caption) return;

  const current = id
    ? await db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, id) })
    : null;
  const imageUrl = await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null);

  if (!imageUrl) return;
  const videoUrl = await resolveVideoUrl(formData, "videoFile", "videoExisting", "videoUrl");

  const [captionEnFinal] = await autoFillTranslations([{ vi: caption, en: captionEn }]);

  if (id) {
    await db
      .update(schema.galleryItems)
      .set({ caption, captionEn: captionEnFinal || null, sortOrder, imageUrl, videoUrl: videoUrl || null })
      .where(eq(schema.galleryItems.id, id));
  } else {
    await db.insert(schema.galleryItems).values({
      caption,
      captionEn: captionEnFinal || null,
      sortOrder,
      imageUrl,
      videoUrl: videoUrl || null,
    });
  }

  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");

  redirect("/admin/thu-vien-trang-chu?saved=1");
}

export async function deleteGalleryItemAction(itemId: string) {
  await requirePermission("homepage");
  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.id, itemId));
  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");
}
