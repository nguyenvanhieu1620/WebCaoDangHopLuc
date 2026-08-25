"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export async function upsertCategoryAction(formData: FormData) {
  await requirePermission("posts");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("categoryName") || "").trim();
  const nameEn = String(formData.get("categoryNameEn") || "").trim();
  if (!name) return;

  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  if (id) {
    // Đổi tên KHÔNG đổi slug — bài viết đang lọc theo slug danh mục (VD
    // "Học bổng" ở Trang chủ) sẽ không bị gãy khi admin chỉ đổi tên hiển thị.
    await db
      .update(schema.categories)
      .set({ name, nameEn: nameEnFinal || null })
      .where(eq(schema.categories.id, id));
  } else {
    const baseSlug = slugify(name) || `danh-muc-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
    await db.insert(schema.categories).values({ name, nameEn: nameEnFinal || null, slug });
  }

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/bai-viet");
  redirect("/admin/danh-muc");
}

export async function deleteCategoryAction(categoryId: string) {
  await requirePermission("posts");
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/bai-viet");
}
