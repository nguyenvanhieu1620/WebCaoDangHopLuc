"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl, saveWithMedia } from "@/lib/media";
import { checkUpload } from "@/lib/upload-rules";
import type { AdminSaveResult } from "@/lib/admin-form";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { vnDatetimeLocalToISO, slugify } from "@/lib/utils";

export async function upsertEventAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("events");
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const startAt = String(formData.get("startAt") || "").trim();
  const endAt = String(formData.get("endAt") || "").trim();
  const titleEn = String(formData.get("titleEn") || "").trim();
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const locationEn = String(formData.get("locationEn") || "").trim();

  const startISO = vnDatetimeLocalToISO(startAt);
  const endISO = endAt ? vnDatetimeLocalToISO(endAt) : null;
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!title) fields.title = "Nhập tên sự kiện.";
  if (!startISO) fields.startAt = "Nhập ngày và giờ bắt đầu hợp lệ.";
  if (endAt && !endISO) fields.endAt = "Nhập ngày và giờ kết thúc hợp lệ.";
  if (startISO && endISO && endISO < startISO) {
    fields.endAt = "Thời gian kết thúc phải bằng hoặc sau thời gian bắt đầu.";
  }
  const coverImage = formData.get("coverImage");
  if (coverImage instanceof File && coverImage.size > 0) {
    const problem = checkUpload(coverImage, ["image"]);
    if (problem) fields.coverImage = problem;
  }
  if (!startISO || Object.keys(fields).length > 0) {
    return { message: "Chưa lưu sự kiện. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [titleEnFinal, descriptionEnFinal, locationEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: description, en: descriptionEn },
    { vi: location, en: locationEn },
  ]);

  let savingImage = false;
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ coverImageUrl: schema.events.coverImageUrl })
        .from(schema.events).where(eq(schema.events.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Sự kiện này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    savingImage = true;
    const coverImageUrl = await resolveImageUrl(
      formData, "coverImage", "coverImageExisting", current?.coverImageUrl ?? null, uploadOptions,
    );
    savingImage = false;

    const values = {
      title,
      titleEn: titleEnFinal || null,
      description: description || null,
      descriptionEn: descriptionEnFinal || null,
      location: location || null,
      locationEn: locationEnFinal || null,
      startAt: startISO,
      endAt: endISO,
      coverImageUrl,
    };
    if (id) {
      // Giữ đường dẫn công khai khi đổi tiêu đề.
      await tx.update(schema.events).set(values).where(eq(schema.events.id, id));
    } else {
      const baseSlug = slugify(title) || `su-kien-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      while (await tx.query.events.findFirst({ where: eq(schema.events.slug, slug) })) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
      await tx.insert(schema.events).values({ ...values, slug });
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được sự kiện.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách sự kiện trước khi thử lại." };
    }
    if (savingImage) {
      return {
        message: "Chưa lưu sự kiện vì không xử lý được ảnh đã chọn.",
        fields: { coverImage: "Kiểm tra lại định dạng và dung lượng ảnh sự kiện." },
      };
    }
    return { message: "Chưa lưu được sự kiện. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/su-kien");
  revalidatePath("/su-kien");
  revalidatePath("/");

  redirect("/admin/su-kien?saved=1");
}

export async function deleteEventAction(eventId: string) {
  await requirePermission("events");
  await db.delete(schema.events).where(eq(schema.events.id, eventId));
  revalidatePath("/admin/su-kien");
  revalidatePath("/su-kien");
  revalidatePath("/");
}
