"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";

export async function createPostAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const publishNow = formData.get("publishNow") === "on";
  const titleEn = String(formData.get("titleEn") || "").trim();
  const excerptEn = String(formData.get("excerptEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();

  if (!title || !content) return;

  const baseSlug = slugify(title) || `bai-viet-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
  while (await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const coverImageUrl = await resolveImageUrl(formData, "coverImage", "coverImageExisting");

  const [titleEnFinal, excerptEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: excerpt, en: excerptEn },
    { vi: content, en: contentEn },
  ]);

  await db.insert(schema.posts).values({
    title,
    titleEn: titleEnFinal || null,
    slug,
    excerpt: excerpt || null,
    excerptEn: excerptEnFinal || null,
    content,
    contentEn: contentEnFinal || null,
    categoryId: categoryId || null,
    coverImageUrl,
    status: publishNow ? "published" : "draft",
    publishedAt: publishNow ? new Date().toISOString() : null,
  });

  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
  revalidatePath("/");
}

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
  revalidatePath("/admin/bai-viet");
}

export async function deleteCategoryAction(categoryId: string) {
  await db.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  revalidatePath("/admin/bai-viet");
}

export async function togglePublishAction(postId: string, nextStatus: "draft" | "published") {
  await db
    .update(schema.posts)
    .set({
      status: nextStatus,
      publishedAt: nextStatus === "published" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.posts.id, postId));

  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
}

export async function deletePostAction(postId: string) {
  await db.delete(schema.posts).where(eq(schema.posts.id, postId));
  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
}
