"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("categoryName") || "").trim();
  const nameEn = String(formData.get("categoryNameEn") || "").trim();
  if (!name) return;

  const baseSlug = slugify(name) || `danh-muc-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  await db.insert(schema.categories).values({ name, nameEn: nameEnFinal || null, slug });
  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/bai-viet");
}

export async function deleteCategoryAction(categoryId: string) {
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/bai-viet");
}
