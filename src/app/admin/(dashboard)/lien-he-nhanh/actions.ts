"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { normalizeExternalUrl, normalizeZaloUrl } from "@/lib/utils";
import { safeHref } from "@/lib/safe-href";
import { normalizeVnPhone } from "@/lib/validate";
import type { AdminSaveResult } from "@/lib/admin-form";
import { getSiteSettings } from "@/lib/data/site-settings";
import { quickContactHotlineHref, quickContactHotlineLabel } from "@/lib/quick-contact-hotline";
import { isQuickContactType } from "./types";

function zaloHref(rawHref: string): string | null {
  const phone = normalizeVnPhone(rawHref.replace(/^#+/, "").trim());
  if (/^\+?\d+$/.test(phone)) {
    return /^\+?\d{9,15}$/.test(phone) ? normalizeZaloUrl(phone) : null;
  }
  const href = normalizeZaloUrl(rawHref);
  if (!href) return null;
  const { hostname, pathname } = new URL(href);
  return (hostname === "zalo.me" || hostname.endsWith(".zalo.me")) && pathname !== "/" ? safeHref(href) : null;
}

export async function upsertQuickContactAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("admissions-contact");
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const rawHref = String(formData.get("href") || "").trim();
  const href = type === "zalo" ? zaloHref(rawHref) : safeHref(
    (type === "facebook" ? normalizeExternalUrl(rawHref) : null) ?? rawHref,
  );
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const labelEn = String(formData.get("labelEn") || "").trim();

  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!isQuickContactType(type)) fields.type = "Chọn loại liên hệ.";
  if (type !== "hotline") {
    if (!label) fields.label = "Nhập tên hiển thị.";
    if (!href) {
      fields.href = type === "zalo"
        ? "Nhập số điện thoại hoặc đường dẫn Zalo hợp lệ, ví dụ https://zalo.me/0900000000."
        : "Nhập đường dẫn hợp lệ cho loại liên hệ đã chọn.";
    }
  }
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu nút liên hệ. Kiểm tra lại thông tin bên dưới.", fields };
  }

  let values: typeof schema.quickContacts.$inferInsert;
  if (type === "hotline") {
    const { hotline } = await getSiteSettings();
    const hotlineHref = quickContactHotlineHref(hotline);
    if (!hotlineHref) return { message: "Cần có số Hotline hợp lệ trong Cài đặt chung trước khi lưu nút." };
    values = {
      type,
      label: quickContactHotlineLabel(hotline),
      labelEn: quickContactHotlineLabel(hotline, "en"),
      href: hotlineHref,
      sortOrder,
    };
  } else {
    if (!href) return { message: "Chưa lưu nút liên hệ.", fields: { href: "Nhập đường dẫn hợp lệ." } };
    const [labelEnFinal] = await autoFillTranslations([{ vi: label, en: labelEn }]);
    values = { type, label, labelEn: labelEnFinal || null, href, sortOrder };
  }
  if (id) {
    const [saved] = await db.update(schema.quickContacts).set(values)
      .where(eq(schema.quickContacts.id, id)).returning({ id: schema.quickContacts.id });
    if (!saved) return { message: "Nút liên hệ này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };
  } else {
    await db.insert(schema.quickContacts).values(values);
  }

  revalidatePath("/admin/lien-he-nhanh");
  revalidatePath("/", "layout");

  redirect("/admin/lien-he-nhanh?saved=1");
}

export async function deleteQuickContactAction(id: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.quickContacts).where(eq(schema.quickContacts.id, id));
  revalidatePath("/admin/lien-he-nhanh");
  revalidatePath("/", "layout");
}
