"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { resolveImageUrl, saveUploadedFile } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

/** Xử lý field "attachment" (PDF/Word/Excel) — có file mới thì upload + lưu tên gốc để hiện link đẹp; tick "removeAttachment" thì xoá; không đụng gì thì giữ nguyên giá trị cũ. */
async function resolveAttachment(
  formData: FormData,
  current: { attachmentUrl: string | null; attachmentName: string | null } | null | undefined
): Promise<{ attachmentUrl: string | null; attachmentName: string | null }> {
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file);
    return { attachmentUrl: saved.url, attachmentName: file.name };
  }
  if (formData.get("removeAttachment") === "on") {
    return { attachmentUrl: null, attachmentName: null };
  }
  return {
    attachmentUrl: current?.attachmentUrl ?? null,
    attachmentName: current?.attachmentName ?? null,
  };
}

export async function upsertPostAction(formData: FormData) {
  await requirePermission("posts");
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const publishNow = formData.get("publishNow") === "on";
  const isPinned = formData.get("isPinned") === "on";
  const titleEn = String(formData.get("titleEn") || "").trim();
  const excerptEn = String(formData.get("excerptEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();

  if (!title || !content) return;

  const current = id ? await db.query.posts.findFirst({ where: eq(schema.posts.id, id) }) : null;
  const coverImageUrl = await resolveImageUrl(
    formData,
    "coverImage",
    "coverImageExisting",
    current?.coverImageUrl ?? null
  );
  const { attachmentUrl, attachmentName } = await resolveAttachment(formData, current);

  const [titleEnFinal, excerptEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: excerpt, en: excerptEn },
    { vi: content, en: contentEn },
  ]);

  if (id) {
    // Sửa bài viết KHÔNG đổi slug (dù đổi tiêu đề) — tránh vỡ link cũ đã
    // chia sẻ/được Google index. Trạng thái đăng/nháp cũng giữ nguyên, quản
    // lý riêng qua nút "Đăng ngay"/"Gỡ đăng" ở danh sách, không qua form này.
    await db
      .update(schema.posts)
      .set({
        title,
        titleEn: titleEnFinal || null,
        excerpt: excerpt || null,
        excerptEn: excerptEnFinal || null,
        content,
        contentEn: contentEnFinal || null,
        categoryId: categoryId || null,
        coverImageUrl,
        isPinned: isPinned ? 1 : 0,
        attachmentUrl,
        attachmentName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.posts.id, id));
  } else {
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
      titleEn: titleEnFinal || null,
      slug,
      excerpt: excerpt || null,
      excerptEn: excerptEnFinal || null,
      content,
      contentEn: contentEnFinal || null,
      categoryId: categoryId || null,
      coverImageUrl,
      isPinned: isPinned ? 1 : 0,
      attachmentUrl,
      attachmentName,
      status: publishNow ? "published" : "draft",
      publishedAt: publishNow ? new Date().toISOString() : null,
    });
  }

  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/bai-viet?saved=1");
}

export async function togglePublishAction(postId: string, nextStatus: "draft" | "published") {
  await requirePermission("posts");
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
  await requirePermission("posts");
  await db.delete(schema.posts).where(eq(schema.posts.id, postId));
  revalidatePath("/admin/bai-viet");
  revalidatePath("/admin");
}
