"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import type { AdminSaveResult } from "@/lib/admin-form";
import { isAdmissionItemType } from "./sections";

export async function upsertAdmissionItemAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("admissions-contact");
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const meta = String(formData.get("meta") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const titleEn = String(formData.get("titleEn") || "").trim();
  const detailEn = String(formData.get("detailEn") || "").trim();
  const metaEn = String(formData.get("metaEn") || "").trim();

  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!title) fields.title = "Nhập tiêu đề.";
  if (!isAdmissionItemType(type)) fields.type = "Chọn nhóm thông tin tuyển sinh.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu mục tuyển sinh. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const isTimeline = type === "timeline";
  const [titleEnFinal, detailEnFinal, metaEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: detail, en: detailEn },
    ...(isTimeline ? [{ vi: meta, en: metaEn }] : []),
  ]);

  const values = {
    type,
    title,
    titleEn: titleEnFinal || null,
    detail: detail || null,
    detailEn: detailEnFinal || null,
    // Mục ngoài nhóm mốc thời gian có thể đã có dữ liệu thời gian từ form cũ.
    ...(isTimeline ? { meta: meta || null, metaEn: metaEnFinal || null } : {}),
    sortOrder,
  };

  if (id) {
    const [saved] = await db.update(schema.admissionItems).set(values)
      .where(eq(schema.admissionItems.id, id)).returning({ id: schema.admissionItems.id });
    if (!saved) return { message: "Mục tuyển sinh này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };
  } else {
    await db.insert(schema.admissionItems).values(values);
  }

  revalidatePath("/admin/thong-tin-tuyen-sinh");
  revalidatePath("/tuyen-sinh");
  redirect(`/admin/thong-tin-tuyen-sinh?type=${type}&saved=1`);
}

export async function deleteAdmissionItemAction(itemId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.admissionItems).where(eq(schema.admissionItems.id, itemId));
  revalidatePath("/admin/thong-tin-tuyen-sinh");
  revalidatePath("/tuyen-sinh");
}
