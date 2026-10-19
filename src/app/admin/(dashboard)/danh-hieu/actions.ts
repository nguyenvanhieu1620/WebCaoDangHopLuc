"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export type FacultyAttributeType = "academic_rank" | "degree" | "position";
const TYPES: FacultyAttributeType[] = ["academic_rank", "degree", "position"];

export async function upsertFacultyAttributeAction(formData: FormData) {
  await requirePermission("faculty");
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim() as FacultyAttributeType;
  const name = String(formData.get("name") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  if (!name || !TYPES.includes(type)) return;

  // Chỉ dịch khi ô tiếng Anh để trống — bản tiếng Anh admin đã tự sửa thì giữ nguyên.
  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);
  let sortOrder = Number(sortOrderRaw);
  if (!sortOrderRaw || !Number.isFinite(sortOrder)) {
    const [{ total }] = await db.select({ total: count() }).from(schema.facultyAttributes).where(eq(schema.facultyAttributes.type, type));
    sortOrder = total;
  }

  if (id) {
    await db
      .update(schema.facultyAttributes)
      .set({ type, name, nameEn: nameEnFinal || null, sortOrder })
      .where(eq(schema.facultyAttributes.id, id));
  } else {
    await db.insert(schema.facultyAttributes).values({ type, name, nameEn: nameEnFinal || null, sortOrder });
  }

  revalidatePath("/admin/danh-hieu");
  revalidatePath("/admin/giang-vien");
  redirect(`/admin/danh-hieu?type=${type}&saved=1`);
}

export async function deleteFacultyAttributeAction(id: string) {
  await requirePermission("faculty");
  await db.delete(schema.facultyAttributes).where(eq(schema.facultyAttributes.id, id));
  revalidatePath("/admin/danh-hieu");
  revalidatePath("/admin/giang-vien");
}
