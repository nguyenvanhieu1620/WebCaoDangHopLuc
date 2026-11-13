"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-permissions";
import { isValidEmail, normalizeVnPhone } from "@/lib/validate";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";
import { safeHref } from "@/lib/safe-href";
import type { AdminSaveResult } from "@/lib/admin-form";

export async function updateSiteSettingsAction(formData: FormData): Promise<AdminSaveResult> {
  const user = await requirePermission("site-settings");
  const canEditEmail = hasPermission(user, "admissions-contact");
  const hotline = String(formData.get("hotline") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const announcement = String(formData.get("announcement") || "").trim();
  const announcementEn = String(formData.get("announcementEn") || "").trim();
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!announcement) fields.announcement = "Nhập nội dung banner thông báo.";
  if (!/^\+?\d+$/.test(normalizeVnPhone(hotline))) fields.hotline = "Nhập số hotline hợp lệ.";
  if (!address) fields.address = "Nhập địa chỉ.";

  // Link trống được lưu dưới dạng "#" để ẩn nút tương ứng.
  const link = (field: string, label: string, normalize = normalizeExternalUrl) => {
    const raw = String(formData.get(field) || "").trim();
    if (!raw || raw === "#") return "#";
    const url = safeHref(normalize(raw) ?? "");
    if (!url) fields[field] = `Nhập đường dẫn ${label} hợp lệ hoặc để trống.`;
    return url ?? "#";
  };
  const facebookUrl = link("facebookUrl", "Facebook");
  const zaloUrl = link("zaloUrl", "Zalo", normalizeZaloUrl);
  const youtubeUrl = link("youtubeUrl", "YouTube");
  const lmsUrl = link("lmsUrl", "LMS");

  // Email nhận thông báo có dữ liệu hồ sơ. Chỉ tài khoản có quyền tuyển sinh mới được ghi cột này.
  if (canEditEmail && !isValidEmail(email)) fields.email = "Nhập địa chỉ email hợp lệ.";
  if (!canEditEmail && formData.has("email")) {
    const current = await db.query.siteSettings.findFirst({
      columns: { email: true }, where: eq(schema.siteSettings.id, "main"),
    });
    if (current?.email !== email) fields.email = "Cần quyền Tuyển sinh & Liên hệ để đổi email nhận hồ sơ.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu cài đặt. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [announcementEnFinal] = await autoFillTranslations([
    { vi: announcement, en: announcementEn },
  ]);

  const [saved] = await db
    .update(schema.siteSettings)
    .set({
      hotline,
      email: canEditEmail ? email : undefined,
      address,
      announcement,
      announcementEn: announcementEnFinal || null,
      facebookUrl,
      zaloUrl,
      youtubeUrl,
      lmsUrl,
      // pageBannerUrl KHÔNG sửa ở đây — quản lý ở admin/banner-trang-con.
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.siteSettings.id, "main"))
    .returning({ id: schema.siteSettings.id });
  if (!saved) return { message: "Không tìm thấy dữ liệu cài đặt. Hãy tải lại trang để kiểm tra." };

  revalidatePath("/", "layout");
  revalidatePath("/lms");
  revalidatePath("/admin/cai-dat");

  redirect("/admin/cai-dat?saved=1");
}
