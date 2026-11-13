"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { resolveImageUrl, saveUploadedFile, saveWithMedia, type MediaUploadOptions } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { checkUpload } from "@/lib/upload-rules";
import type { AdminSaveResult } from "@/lib/admin-form";

/** Xử lý field "attachment" (PDF/Word/Excel) — có file mới thì upload + lưu tên gốc để hiện link đẹp; tick "removeAttachment" thì xoá; không đụng gì thì giữ nguyên giá trị cũ. */
async function resolveAttachment(
  formData: FormData,
  current: { attachmentUrl: string | null; attachmentName: string | null } | undefined,
  uploadOptions: MediaUploadOptions,
): Promise<{ attachmentUrl: string | null; attachmentName: string | null }> {
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file, uploadOptions);
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

export async function upsertPostAction(formData: FormData): Promise<AdminSaveResult> {
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

  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!title) fields.title = "Nhập tiêu đề bài viết.";
  if (!content) fields.content = "Nhập nội dung bài viết.";
  for (const [field, kind] of [["coverImage", "image"], ["attachment", "document"]] as const) {
    const file = formData.get(field);
    if (file instanceof File && file.size > 0) {
      const problem = checkUpload(file, [kind]);
      if (problem) fields[field] = problem;
    }
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu bài viết. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [titleEnFinal, excerptEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: excerpt, en: excerptEn },
    { vi: content, en: contentEn },
  ]);

  const saveProgress: { uploadField?: "coverImage" | "attachment" } = {};
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({
        coverImageUrl: schema.posts.coverImageUrl,
        attachmentUrl: schema.posts.attachmentUrl,
        attachmentName: schema.posts.attachmentName,
      }).from(schema.posts).where(eq(schema.posts.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Bài viết này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    saveProgress.uploadField = "coverImage";
    const coverImageUrl = await resolveImageUrl(formData, "coverImage", "coverImageExisting", current?.coverImageUrl ?? null, uploadOptions);
    saveProgress.uploadField = "attachment";
    const { attachmentUrl, attachmentName } = await resolveAttachment(formData, current, uploadOptions);
    saveProgress.uploadField = undefined;

    const values = {
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
    };
    if (id) {
      // Giữ đường dẫn công khai và trạng thái đăng khi sửa nội dung.
      await tx.update(schema.posts)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(schema.posts.id, id));
    } else {
      const baseSlug = slugify(title) || `bai-viet-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      while (await tx.query.posts.findFirst({ where: eq(schema.posts.slug, slug) })) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
      await tx.insert(schema.posts).values({
        ...values,
        slug,
        status: publishNow ? "published" : "draft",
        publishedAt: publishNow ? new Date().toISOString() : null,
      });
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được bài viết.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách bài viết trước khi thử lại." };
    }
    const field = saveProgress.uploadField;
    if (field) {
      return {
        message: "Chưa lưu bài viết vì không xử lý được tệp đã chọn.",
        fields: {
          [field]: field === "coverImage"
            ? "Kiểm tra lại định dạng và dung lượng ảnh đại diện."
            : "Kiểm tra lại định dạng và dung lượng tệp đính kèm.",
        },
      };
    }
    return { message: "Chưa lưu được bài viết. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

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
