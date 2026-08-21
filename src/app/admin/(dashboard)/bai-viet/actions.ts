"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function createPostAction(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
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

  await db.insert(schema.posts).values({
    title,
    slug,
    excerpt: excerpt || null,
    content,
    status: publishNow ? "published" : "draft",
    publishedAt: publishNow ? new Date().toISOString() : null,
  });

  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
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
