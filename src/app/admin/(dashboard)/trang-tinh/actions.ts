"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";

export async function upsertPageAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const titleEn = String(formData.get("titleEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();

  if (!title || !content) return;

  const [titleEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: content, en: contentEn },
  ]);

  if (id) {
    await db
      .update(schema.pages)
      .set({
        title,
        titleEn: titleEnFinal || null,
        content,
        contentEn: contentEnFinal || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.pages.id, id));
  } else {
    const baseSlug = slugify(slugInput || title) || `trang-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
    while (await db.query.pages.findFirst({ where: eq(schema.pages.slug, slug) })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    await db.insert(schema.pages).values({
      slug,
      title,
      titleEn: titleEnFinal || null,
      content,
      contentEn: contentEnFinal || null,
    });
  }

  revalidatePath("/admin/trang-tinh");
}

export async function deletePageAction(pageId: string) {
  await db.delete(schema.pages).where(eq(schema.pages.id, pageId));
  revalidatePath("/admin/trang-tinh");
}
