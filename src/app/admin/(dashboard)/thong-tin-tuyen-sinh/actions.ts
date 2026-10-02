"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export type AdmissionItemType = "timeline" | "method" | "document";
const TYPES: AdmissionItemType[] = ["timeline", "method", "document"];

export async function upsertAdmissionItemAction(formData: FormData) {
  await requirePermission("admissions-contact");
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim() as AdmissionItemType;
  const title = String(formData.get("title") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const meta = String(formData.get("meta") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const titleEn = String(formData.get("titleEn") || "").trim();
  const detailEn = String(formData.get("detailEn") || "").trim();
  const metaEn = String(formData.get("metaEn") || "").trim();

  if (!title || !TYPES.includes(type)) return;

  const [titleEnFinal, detailEnFinal, metaEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: detail, en: detailEn },
    { vi: meta, en: metaEn },
  ]);

  const values = {
    type,
    title,
    titleEn: titleEnFinal || null,
    detail: detail || null,
    detailEn: detailEnFinal || null,
    meta: meta || null,
    metaEn: metaEnFinal || null,
    sortOrder,
  };

  if (id) {
    await db.update(schema.admissionItems).set(values).where(eq(schema.admissionItems.id, id));
  } else {
    await db.insert(schema.admissionItems).values(values);
  }

  revalidatePath("/admin/thong-tin-tuyen-sinh");
  revalidatePath("/tuyen-sinh");
  redirect("/admin/thong-tin-tuyen-sinh");
}

export async function deleteAdmissionItemAction(itemId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.admissionItems).where(eq(schema.admissionItems.id, itemId));
  revalidatePath("/admin/thong-tin-tuyen-sinh");
  revalidatePath("/tuyen-sinh");
}
