"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertDepartmentAction(formData: FormData) {
  await requirePermission("faculty");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const nameEn = String(formData.get("nameEn") || "").trim();

  if (!name) return;

  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  if (id) {
    await db
      .update(schema.departments)
      .set({ name, nameEn: nameEnFinal || null, sortOrder })
      .where(eq(schema.departments.id, id));
  } else {
    await db.insert(schema.departments).values({ name, nameEn: nameEnFinal || null, sortOrder });
  }

  revalidatePath("/admin/khoa");
  revalidatePath("/admin/giang-vien");
  revalidatePath("/doi-ngu-giang-vien", "layout");

  redirect("/admin/khoa");
}

export async function deleteDepartmentAction(departmentId: string) {
  await requirePermission("faculty");
  // Xoá khoa không xoá giảng viên thuộc khoa đó — chỉ gỡ liên kết (departmentId về null).
  await db
    .update(schema.faculty)
    .set({ departmentId: null })
    .where(eq(schema.faculty.departmentId, departmentId));
  await db.delete(schema.departments).where(eq(schema.departments.id, departmentId));

  revalidatePath("/admin/khoa");
  revalidatePath("/admin/giang-vien");
  revalidatePath("/doi-ngu-giang-vien", "layout");
}
