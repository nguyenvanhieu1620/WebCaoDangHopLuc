"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export type FacultyAttributeType = "academic_rank" | "degree" | "position";

export async function upsertFacultyAttributeAction(formData: FormData) {
  await requirePermission("faculty");
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim() as FacultyAttributeType;
  const name = String(formData.get("name") || "").trim();
  if (!name || !["academic_rank", "degree", "position"].includes(type)) return;

  if (id) {
    await db.update(schema.facultyAttributes).set({ name }).where(eq(schema.facultyAttributes.id, id));
  } else {
    const count = await db.query.facultyAttributes.findMany({
      where: eq(schema.facultyAttributes.type, type),
    });
    const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: "" }]);

    await db.insert(schema.facultyAttributes).values({
      type,
      name,
      nameEn: nameEnFinal || null,
      sortOrder: count.length,
    });
  }

  revalidatePath("/admin/danh-hieu");
  revalidatePath("/admin/giang-vien");
}

export async function deleteFacultyAttributeAction(id: string) {
  await requirePermission("faculty");
  await db.delete(schema.facultyAttributes).where(eq(schema.facultyAttributes.id, id));
  revalidatePath("/admin/danh-hieu");
  revalidatePath("/admin/giang-vien");
}
