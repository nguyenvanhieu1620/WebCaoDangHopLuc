"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFileIfPresent } from "@/lib/media";

export async function upsertGalleryItemAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!caption) return;

  const current = id
    ? await db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, id) })
    : null;
  const imageUrl = await saveUploadedFileIfPresent(formData, "image", current?.imageUrl ?? null);

  if (!imageUrl) return;

  if (id) {
    await db
      .update(schema.galleryItems)
      .set({ caption, sortOrder, imageUrl })
      .where(eq(schema.galleryItems.id, id));
  } else {
    await db.insert(schema.galleryItems).values({ caption, sortOrder, imageUrl });
  }

  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");
}

export async function deleteGalleryItemAction(itemId: string) {
  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.id, itemId));
  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");
}
