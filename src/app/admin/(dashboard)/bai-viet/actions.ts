"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { saveUploadedFileIfPresent } from "@/lib/media";

export async function createPostAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const publishNow = formData.get("publishNow") === "on";

  if (!title || !content) return;

  const baseSlug = slugify(title) || `bai-viet-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
  while (await db.query.posts.findFirst({ where: eq(schema.posts.slug, slug) })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const coverImageUrl = await saveUploadedFileIfPresent(formData, "coverImage");

  await db.insert(schema.posts).values({
    title,
    slug,
    excerpt: excerpt || null,
    content,
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
  if (!name) return;

  const baseSlug = slugify(name) || `danh-muc-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  await db.insert(schema.categories).values({ name, slug });
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
