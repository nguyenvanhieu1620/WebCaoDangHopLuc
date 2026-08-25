"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export async function upsertHeroBannerAction(formData: FormData) {
  await requirePermission("homepage");
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const captionEn = String(formData.get("captionEn") || "").trim();

  const current = id
    ? await db.query.heroBanners.findFirst({ where: eq(schema.heroBanners.id, id) })
    : null;
  const imageUrl = await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null);

  if (!imageUrl) return;

  const [captionEnFinal] = await autoFillTranslations([{ vi: caption, en: captionEn }]);

  const values = {
    caption: caption || null,
    captionEn: captionEnFinal || null,
    linkUrl: linkUrl || null,
    sortOrder,
    imageUrl,
  };

  if (id) {
    await db.update(schema.heroBanners).set(values).where(eq(schema.heroBanners.id, id));
  } else {
    await db.insert(schema.heroBanners).values(values);
  }

  revalidatePath("/admin/banner-trang-chu");
  revalidatePath("/");
}

export async function deleteHeroBannerAction(bannerId: string) {
  await requirePermission("homepage");
  await db.delete(schema.heroBanners).where(eq(schema.heroBanners.id, bannerId));
  revalidatePath("/admin/banner-trang-chu");
  revalidatePath("/");
}
