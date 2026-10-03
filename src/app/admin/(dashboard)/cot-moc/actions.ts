"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { resolveImageUrl } from "@/lib/media";

/** Năm hợp lệ cho 1 cột mốc — chặn gõ nhầm (VD "226" hay "20266"). */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

export async function upsertMilestoneAction(formData: FormData) {
  await requirePermission("pages");
  const id = String(formData.get("id") || "").trim();
  const year = Math.trunc(Number(formData.get("year")));
  const period = String(formData.get("period") || "").trim().slice(0, 60);
  const title = String(formData.get("title") || "").trim().slice(0, 200);
  const description = String(formData.get("description") || "").trim().slice(0, 2000);
  const periodEn = String(formData.get("periodEn") || "").trim().slice(0, 60);
  const titleEn = String(formData.get("titleEn") || "").trim().slice(0, 200);
  const descriptionEn = String(formData.get("descriptionEn") || "").trim().slice(0, 2000);
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;

  if (!title || !Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) return;

  const current = id ? await db.query.milestones.findFirst({ where: eq(schema.milestones.id, id) }) : null;
  const imageUrl =
    formData.get("removeImage") === "on"
      ? null
      : await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null);

  const [periodEnFinal, titleEnFinal, descriptionEnFinal] = await autoFillTranslations([
    { vi: period, en: periodEn },
    { vi: title, en: titleEn },
    { vi: description, en: descriptionEn },
  ]);

  const values = {
    year,
    period: period || null,
    periodEn: (period && periodEnFinal) || null,
    title,
    titleEn: titleEnFinal || null,
    description: description || null,
    descriptionEn: (description && descriptionEnFinal) || null,
    imageUrl,
    sortOrder,
  };

  if (id) {
    await db.update(schema.milestones).set(values).where(eq(schema.milestones.id, id));
  } else {
    await db.insert(schema.milestones).values(values);
  }

  revalidatePath("/admin/cot-moc");
  revalidatePath("/gioi-thieu");

  redirect("/admin/cot-moc");
}

export async function deleteMilestoneAction(milestoneId: string) {
  await requirePermission("pages");
  await db.delete(schema.milestones).where(eq(schema.milestones.id, milestoneId));
  revalidatePath("/admin/cot-moc");
  revalidatePath("/gioi-thieu");
}
