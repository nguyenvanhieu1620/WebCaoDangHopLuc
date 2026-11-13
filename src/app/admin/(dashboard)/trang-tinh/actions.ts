"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";
import { resolveImageUrl, saveWithMedia } from "@/lib/media";
import { checkUpload } from "@/lib/upload-rules";
import type { AdminSaveResult } from "@/lib/admin-form";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertPageAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("pages");
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const titleEn = String(formData.get("titleEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();

  const baseSlug = slugify(slugInput || title);
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!title) fields.title = "Nhập tiêu đề trang.";
  if (!content) fields.content = "Nhập nội dung trang.";
  if (!id && slugInput && !/[a-z0-9]/.test(baseSlug)) {
    fields.slug = "Nhập slug có chữ hoặc số, hoặc để trống để tự tạo từ tiêu đề.";
  }
  const coverImage = formData.get("coverImage");
  if (coverImage instanceof File && coverImage.size > 0) {
    const problem = checkUpload(coverImage, ["image"]);
    if (problem) fields.coverImage = problem;
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu trang tĩnh. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [titleEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: content, en: contentEn },
  ]);

  let savingImage = false;
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ coverImageUrl: schema.pages.coverImageUrl })
        .from(schema.pages).where(eq(schema.pages.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Trang này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    savingImage = true;
    const coverImageUrl = await resolveImageUrl(
      formData, "coverImage", "coverImageExisting", current?.coverImageUrl ?? null, uploadOptions,
    );
    savingImage = false;

    const values = {
      title,
      titleEn: titleEnFinal || null,
      coverImageUrl,
      content,
      contentEn: contentEnFinal || null,
    };
    if (id) {
      await tx.update(schema.pages)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(schema.pages.id, id));
    } else {
      const slugRoot = baseSlug || `trang-${Date.now()}`;
      let slug = slugRoot;
      let counter = 1;
      while (await tx.query.pages.findFirst({ where: eq(schema.pages.slug, slug) })) {
        counter += 1;
        slug = `${slugRoot}-${counter}`;
      }
      await tx.insert(schema.pages).values({ ...values, slug });
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được trang tĩnh.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách trang trước khi thử lại." };
    }
    if (savingImage) {
      return {
        message: "Chưa lưu trang vì không xử lý được ảnh đã chọn.",
        fields: { coverImage: "Kiểm tra lại định dạng và dung lượng ảnh banner." },
      };
    }
    return { message: "Chưa lưu được trang. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/trang-tinh");

  redirect("/admin/trang-tinh?saved=1");
}

export async function deletePageAction(pageId: string) {
  await requirePermission("pages");
  await db.delete(schema.pages).where(eq(schema.pages.id, pageId));
  revalidatePath("/admin/trang-tinh");
}
