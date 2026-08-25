"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";

const VALID_TYPES = ["hotline", "zalo", "facebook", "message", "chatbot", "custom"];

export async function upsertQuickContactAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const href = String(formData.get("href") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const labelEn = String(formData.get("labelEn") || "").trim();

  if (!label || !href || !VALID_TYPES.includes(type)) return;

  const [labelEnFinal] = await autoFillTranslations([{ vi: label, en: labelEn }]);

  if (id) {
    await db
      .update(schema.quickContacts)
      .set({ type, label, labelEn: labelEnFinal || null, href, sortOrder })
      .where(eq(schema.quickContacts.id, id));
  } else {
    await db.insert(schema.quickContacts).values({
      type,
      label,
      labelEn: labelEnFinal || null,
      href,
      sortOrder,
    });
  }

  revalidatePath("/admin/lien-he-nhanh");
  revalidatePath("/", "layout");
}

export async function deleteQuickContactAction(id: string) {
  await db.delete(schema.quickContacts).where(eq(schema.quickContacts.id, id));
  revalidatePath("/admin/lien-he-nhanh");
  revalidatePath("/", "layout");
}
