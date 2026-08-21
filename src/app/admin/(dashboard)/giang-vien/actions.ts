"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFileIfPresent } from "@/lib/media";

export async function upsertFacultyAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name || !role) return;

  const current = id
    ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, id) })
    : null;
  const photoUrl = await saveUploadedFileIfPresent(formData, "photo", current?.photoUrl ?? null);

  if (id) {
    await db.update(schema.faculty).set({ name, role, sortOrder, photoUrl }).where(eq(schema.faculty.id, id));
  } else {
    await db.insert(schema.faculty).values({ name, role, sortOrder, photoUrl });
  }

  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
}

export async function deleteFacultyAction(facultyId: string) {
  await db.delete(schema.faculty).where(eq(schema.faculty.id, facultyId));
  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
}
