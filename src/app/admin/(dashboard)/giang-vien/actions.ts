"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { slugify } from "@/lib/utils";

export async function upsertFacultyAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const education = String(formData.get("education") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const roleEn = String(formData.get("roleEn") || "").trim();
  const educationEn = String(formData.get("educationEn") || "").trim();
  const specialtyEn = String(formData.get("specialtyEn") || "").trim();
  const bioEn = String(formData.get("bioEn") || "").trim();

  if (!name || !role) return;

  const current = id
    ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, id) })
    : null;
  const photoUrl = await resolveImageUrl(formData, "photo", "photoExisting", current?.photoUrl ?? null);

  const [roleEnFinal, educationEnFinal, specialtyEnFinal, bioEnFinal] = await autoFillTranslations([
    { vi: role, en: roleEn },
    { vi: education, en: educationEn },
    { vi: specialty, en: specialtyEn },
    { vi: bio, en: bioEn },
  ]);

  const values = {
    name,
    role,
    roleEn: roleEnFinal || null,
    education: education || null,
    educationEn: educationEnFinal || null,
    specialty: specialty || null,
    specialtyEn: specialtyEnFinal || null,
    bio: bio || null,
    bioEn: bioEnFinal || null,
    sortOrder,
    photoUrl,
  };

  if (id) {
    await db.update(schema.faculty).set(values).where(eq(schema.faculty.id, id));
  } else {
    const baseSlug = slugify(name) || `giang-vien-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
    while (await db.query.faculty.findFirst({ where: eq(schema.faculty.slug, slug) })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }
    await db.insert(schema.faculty).values({ ...values, slug });
  }

  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  revalidatePath("/doi-ngu-giang-vien", "layout");
}

export async function deleteFacultyAction(facultyId: string) {
  await db.delete(schema.faculty).where(eq(schema.faculty.id, facultyId));
  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  revalidatePath("/doi-ngu-giang-vien", "layout");
}
