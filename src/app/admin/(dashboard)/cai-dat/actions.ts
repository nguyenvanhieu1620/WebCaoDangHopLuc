"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";

export async function updateSiteSettingsAction(formData: FormData) {
  await requirePermission("site-settings");
  const hotline = String(formData.get("hotline") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const announcement = String(formData.get("announcement") || "").trim();
  const announcementEn = String(formData.get("announcementEn") || "").trim();
  // Link ngoài: để trống → "#" (web tự ẩn nút); có gõ → chuẩn hoá (bỏ "#" thừa ở đầu, thêm
  // https://…). Gõ chữ không phải link → KHÔNG lưu ô đó (giữ link cũ), báo lại cho admin.
  const invalidLinks: string[] = [];
  const link = (field: string, label: string, normalize = normalizeExternalUrl) => {
    const raw = String(formData.get(field) || "").trim();
    if (!raw || raw === "#") return "#";
    const url = normalize(raw);
    if (!url) invalidLinks.push(label);
    return url ?? undefined; // undefined = Drizzle bỏ qua cột này khi update
  };
  const facebookUrl = link("facebookUrl", "Facebook");
  const zaloUrl = link("zaloUrl", "Zalo", normalizeZaloUrl);
  const youtubeUrl = link("youtubeUrl", "YouTube");
  const lmsUrl = link("lmsUrl", "LMS");

  if (!hotline || !email || !address || !announcement) return;

  const [announcementEnFinal] = await autoFillTranslations([
    { vi: announcement, en: announcementEn },
  ]);

  await db
    .update(schema.siteSettings)
    .set({
      hotline,
      email,
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
    .where(eq(schema.siteSettings.id, "main"));

  revalidatePath("/", "layout");
  revalidatePath("/lms");
  revalidatePath("/admin/cai-dat");

  redirect(
    invalidLinks.length
      ? `/admin/cai-dat?saved=1&invalid=${encodeURIComponent(invalidLinks.join(", "))}`
      : "/admin/cai-dat?saved=1"
  );
}
