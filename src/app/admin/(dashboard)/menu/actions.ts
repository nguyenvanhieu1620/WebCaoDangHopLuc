"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, or, sql } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { safeHref } from "@/lib/safe-href";
import type { AdminSaveResult } from "@/lib/admin-form";
import { MENU_HAS_CHILDREN_ERROR, MENU_HREF_ERROR } from "./validation";

export async function upsertNavItemAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("menu");
  const id = String(formData.get("id") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const href = safeHref(String(formData.get("href") || ""));
  const parentId = String(formData.get("parentId") || "").trim() || null;
  const isPrimary = formData.get("isPrimary") === "on" ? 1 : 0;
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const labelEn = String(formData.get("labelEn") || "").trim();
  const description = String(formData.get("description") || "").trim().slice(0, 90);
  const descriptionEn = String(formData.get("descriptionEn") || "").trim().slice(0, 90);

  const message = "Chưa lưu mục menu. Kiểm tra lại thông tin bên dưới.";
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!label) fields.label = "Nhập tên hiển thị.";
  if (!href) fields.href = MENU_HREF_ERROR;
  if (parentId && parentId === id) fields.parentId = "Một mục menu không thể là danh mục cha của chính nó.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (!href || Object.keys(fields).length > 0) return { message, fields };

  const [labelEnFinal, descriptionEnFinal] = await autoFillTranslations([
    { vi: label, en: labelEn },
    { vi: description, en: descriptionEn },
  ]);

  const failure = await db.transaction(async (tx) => {
    // Tuần tự hoá thao tác sửa cây để không thể thêm mục con vào lúc mục cha đang đổi cấp.
    await tx.execute(sql`LOCK TABLE ${schema.navItems} IN SHARE ROW EXCLUSIVE MODE`);
    const current = id ? await tx.query.navItems.findFirst({
      columns: { parentId: true }, where: eq(schema.navItems.id, id),
    }) : null;
    if (id && !current) return { message: "Mục menu này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };

    if (parentId && parentId !== current?.parentId) {
      const parent = await tx.query.navItems.findFirst({
        columns: { parentId: true }, where: eq(schema.navItems.id, parentId),
      });
      if (!parent || parent.parentId) {
        return { message, fields: { parentId: "Chọn một danh mục cấp cao nhất còn tồn tại." } };
      }
      if (id && await tx.query.navItems.findFirst({
        columns: { id: true }, where: eq(schema.navItems.parentId, id),
      })) {
        return { message, fields: { parentId: MENU_HAS_CHILDREN_ERROR } };
      }
    }

    const values = {
      label,
      labelEn: labelEnFinal || null,
      description: description || null,
      descriptionEn: descriptionEnFinal || null,
      href,
      parentId,
      isPrimary,
      sortOrder,
    };
    if (id) {
      await tx.update(schema.navItems).set(values).where(eq(schema.navItems.id, id));
    } else {
      await tx.insert(schema.navItems).values(values);
    }
    return null;
  });
  if (failure) return failure;

  revalidatePath("/admin/menu", "layout");
  revalidatePath("/", "layout");

  redirect("/admin/menu?saved=1");
}

export async function deleteNavItemAction(navItemId: string) {
  await requirePermission("menu");
  await db.transaction(async (tx) => {
    await tx.execute(sql`LOCK TABLE ${schema.navItems} IN SHARE ROW EXCLUSIVE MODE`);
    await tx.delete(schema.navItems).where(or(eq(schema.navItems.id, navItemId), eq(schema.navItems.parentId, navItemId)));
  });

  revalidatePath("/admin/menu", "layout");
  revalidatePath("/", "layout");
}
