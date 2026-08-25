"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { slugify } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertFacultyAction(formData: FormData) {
  await requirePermission("faculty");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const departmentId = String(formData.get("departmentId") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const academicRank = String(formData.get("academicRank") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const roleEn = String(formData.get("roleEn") || "").trim();
  const degreeEn = String(formData.get("degreeEn") || "").trim();
  const academicRankEn = String(formData.get("academicRankEn") || "").trim();
  const specialtyEn = String(formData.get("specialtyEn") || "").trim();
  const bioEn = String(formData.get("bioEn") || "").trim();

  if (!name || !role) return;

  const current = id
    ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, id) })
    : null;
  const photoUrl = await resolveImageUrl(formData, "photo", "photoExisting", current?.photoUrl ?? null);

  const [roleEnFinal, degreeEnFinal, academicRankEnFinal, specialtyEnFinal, bioEnFinal] =
    await autoFillTranslations([
      { vi: role, en: roleEn },
      { vi: degree, en: degreeEn },
      { vi: academicRank, en: academicRankEn },
      { vi: specialty, en: specialtyEn },
      { vi: bio, en: bioEn },
    ]);

  const values = {
    name,
    role,
    roleEn: roleEnFinal || null,
    departmentId: departmentId || null,
    degree: degree || null,
    degreeEn: degreeEnFinal || null,
    academicRank: academicRank || null,
    academicRankEn: academicRankEnFinal || null,
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

  redirect("/admin/giang-vien");
}

export async function deleteFacultyAction(facultyId: string) {
  await requirePermission("faculty");
  await db.delete(schema.faculty).where(eq(schema.faculty.id, facultyId));
  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  revalidatePath("/doi-ngu-giang-vien", "layout");
}
