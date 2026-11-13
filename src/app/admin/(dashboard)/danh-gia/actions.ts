"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { isLibraryImageUrl, resolveImageUrl, saveWithMedia } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { checkUpload } from "@/lib/upload-rules";
import type { AdminSaveResult } from "@/lib/admin-form";
import { redirect } from "next/navigation";

export async function upsertTestimonialAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("homepage");
  const id = String(formData.get("id") || "").trim();
  const quote = String(formData.get("quote") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const quoteEn = String(formData.get("quoteEn") || "").trim();
  const roleEn = String(formData.get("roleEn") || "").trim();
  const avatar = formData.get("avatar");
  const pickedAvatar = String(formData.get("avatarExisting") || "").trim();
  const hasAvatarFile = avatar instanceof File && avatar.size > 0;

  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!quote) fields.quote = "Nhập trích dẫn.";
  if (!name) fields.name = "Nhập họ tên.";
  if (!role) fields.role = "Nhập vai trò hiện tại.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (hasAvatarFile) {
    const problem = checkUpload(avatar, ["image"]);
    if (problem) fields.avatar = problem;
  } else if (pickedAvatar && !isLibraryImageUrl(pickedAvatar)) {
    fields.avatar = "Chọn lại ảnh đại diện từ thư viện.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu đánh giá. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [quoteEnFinal, roleEnFinal] = await autoFillTranslations([
    { vi: quote, en: quoteEn },
    { vi: role, en: roleEn },
  ]);

  let uploadingAvatar = false;
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ avatarUrl: schema.testimonials.avatarUrl })
        .from(schema.testimonials).where(eq(schema.testimonials.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Đánh giá này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    uploadingAvatar = hasAvatarFile;
    const avatarUrl = await resolveImageUrl(formData, "avatar", "avatarExisting", current?.avatarUrl ?? null, uploadOptions);
    uploadingAvatar = false;
    const values = {
      quote,
      quoteEn: quoteEnFinal || null,
      name,
      role,
      roleEn: roleEnFinal || null,
      sortOrder,
      avatarUrl,
    };
    if (id) {
      await tx.update(schema.testimonials).set(values).where(eq(schema.testimonials.id, id));
    } else {
      await tx.insert(schema.testimonials).values(values);
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được đánh giá.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách đánh giá trước khi thử lại." };
    }
    if (uploadingAvatar) {
      return {
        message: "Chưa lưu đánh giá vì không xử lý được ảnh đại diện.",
        fields: { avatar: "Kiểm tra lại định dạng và dung lượng ảnh đại diện." },
      };
    }
    return { message: "Chưa lưu được đánh giá. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/danh-gia");
  revalidatePath("/");

  redirect("/admin/danh-gia?saved=1");
}

export async function deleteTestimonialAction(testimonialId: string) {
  await requirePermission("homepage");
  await db.delete(schema.testimonials).where(eq(schema.testimonials.id, testimonialId));
  revalidatePath("/admin/danh-gia");
  revalidatePath("/");
}
