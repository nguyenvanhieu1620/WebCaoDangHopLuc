"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { resolveImageUrl, saveWithMedia } from "@/lib/media";
import { checkUpload } from "@/lib/upload-rules";
import type { AdminSaveResult } from "@/lib/admin-form";
import { redirect } from "next/navigation";

export async function upsertProgramAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("programs");
  const id = String(formData.get("id") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const duration = String(formData.get("duration") || "").trim();
  const intake = Number(formData.get("intake") || 0);
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const featured = formData.get("featured") === "on";
  const nameEn = String(formData.get("nameEn") || "").trim();
  const summaryEn = String(formData.get("summaryEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();
  const tuition = String(formData.get("tuition") || "").trim().slice(0, 80);
  const tuitionEn = String(formData.get("tuitionEn") || "").trim().slice(0, 80);

  const removeImage = formData.get("removeImage") === "on";
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!code) fields.code = "Nhập mã ngành.";
  if (!name) fields.name = "Nhập tên ngành.";
  if (!duration) fields.duration = "Nhập thời gian đào tạo.";
  if (!Number.isInteger(intake) || intake < 1 || intake > 2147483647) {
    fields.intake = "Nhập chỉ tiêu là số nguyên dương trong phạm vi hợp lệ.";
  }
  if (!summary) fields.summary = "Nhập mô tả ngắn.";
  const image = formData.get("image");
  if (!removeImage && image instanceof File && image.size > 0) {
    const problem = checkUpload(image, ["image"]);
    if (problem) fields.image = problem;
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu ngành đào tạo. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [nameEnFinal, summaryEnFinal, contentEnFinal, tuitionEnFinal] = await autoFillTranslations([
    { vi: name, en: nameEn },
    { vi: summary, en: summaryEn },
    { vi: content, en: contentEn },
    { vi: tuition, en: tuitionEn },
  ]);

  let savingImage = false;
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ imageUrl: schema.programs.imageUrl })
        .from(schema.programs).where(eq(schema.programs.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Ngành đào tạo này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    savingImage = !removeImage;
    const imageUrl = removeImage
      ? null
      : await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null, uploadOptions);
    savingImage = false;

    const values = {
      code,
      name,
      nameEn: nameEnFinal || null,
      duration,
      intake,
      summary,
      summaryEn: summaryEnFinal || null,
      content: content || null,
      contentEn: contentEnFinal || null,
      tuition: tuition || null,
      tuitionEn: tuitionEnFinal || null,
      imageUrl,
      featured: featured ? 1 : 0,
    };
    if (id) {
      await tx.update(schema.programs)
        .set({ ...values, updatedAt: new Date().toISOString() })
        .where(eq(schema.programs.id, id));
    } else {
      const baseSlug = slugify(name) || `nganh-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      while (await tx.query.programs.findFirst({ where: eq(schema.programs.slug, slug) })) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
      await tx.insert(schema.programs).values({ ...values, slug });
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được ngành đào tạo.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách ngành trước khi thử lại." };
    }
    if (savingImage) {
      return {
        message: "Chưa lưu ngành đào tạo vì không xử lý được ảnh đã chọn.",
        fields: { image: "Kiểm tra lại định dạng và dung lượng ảnh ngành." },
      };
    }
    return { message: "Chưa lưu được ngành đào tạo. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");
  revalidatePath("/tuyen-sinh");

  redirect("/admin/nganh-dao-tao?saved=1");
}

export async function deleteProgramAction(programId: string) {
  await requirePermission("programs");
  await db.delete(schema.programs).where(eq(schema.programs.id, programId));
  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");
}
