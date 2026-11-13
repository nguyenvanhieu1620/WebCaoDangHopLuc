"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { isLibraryImageUrl, resolveImageUrl, saveWithMedia } from "@/lib/media";
import { checkUpload } from "@/lib/upload-rules";
import { safeHref } from "@/lib/safe-href";
import { normalizeExternalUrl } from "@/lib/utils";
import type { AdminSaveResult } from "@/lib/admin-form";
import { redirect } from "next/navigation";

export async function upsertPartnerAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("partners");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const nameEn = String(formData.get("nameEn") || "").trim();
  const rawWebsite = String(formData.get("websiteUrl") || "").trim();
  const websiteUrl = safeHref(/^https?:\/\//i.test(rawWebsite) ? rawWebsite : normalizeExternalUrl(rawWebsite) ?? "");
  const removeLogo = formData.get("removeLogo") === "on";
  const logo = formData.get("logo");
  const pickedLogo = String(formData.get("logoExisting") || "").trim();
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!name) fields.name = "Nhập tên đối tác.";
  if (rawWebsite && !websiteUrl) fields.websiteUrl = "Nhập địa chỉ website hợp lệ hoặc để trống.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (!removeLogo) {
    if (logo instanceof File && logo.size > 0) {
      const problem = checkUpload(logo, ["image"]);
      if (problem) fields.logo = problem;
    } else if (pickedLogo && !isLibraryImageUrl(pickedLogo)) {
      fields.logo = "Chọn lại logo từ thư viện ảnh.";
    }
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu đối tác. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  let savingLogo = false;
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ logoUrl: schema.partners.logoUrl })
        .from(schema.partners).where(eq(schema.partners.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Đối tác này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    savingLogo = !removeLogo;
    const logoUrl = removeLogo
      ? null
      : await resolveImageUrl(formData, "logo", "logoExisting", current?.logoUrl ?? null, uploadOptions);
    savingLogo = false;

    const values = { name, nameEn: nameEnFinal || null, logoUrl, websiteUrl, sortOrder };
    if (id) {
      await tx.update(schema.partners).set(values).where(eq(schema.partners.id, id));
    } else {
      await tx.insert(schema.partners).values(values);
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được đối tác.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách đối tác trước khi thử lại." };
    }
    if (savingLogo) {
      return { message: "Chưa lưu đối tác vì không xử lý được logo.", fields: { logo: "Kiểm tra lại định dạng và dung lượng logo." } };
    }
    return { message: "Chưa lưu được đối tác. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/doi-tac");
  revalidatePath("/");

  redirect("/admin/doi-tac?saved=1");
}

export async function deletePartnerAction(partnerId: string) {
  await requirePermission("partners");
  await db.delete(schema.partners).where(eq(schema.partners.id, partnerId));
  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}
