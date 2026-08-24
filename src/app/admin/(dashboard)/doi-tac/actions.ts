"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";

export async function upsertPartnerAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const nameEn = String(formData.get("nameEn") || "").trim();

  if (!name) return;

  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  if (id) {
    await db
      .update(schema.partners)
      .set({ name, nameEn: nameEnFinal || null, sortOrder })
      .where(eq(schema.partners.id, id));
  } else {
    await db.insert(schema.partners).values({ name, nameEn: nameEnFinal || null, sortOrder });
  }

  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}

export async function deletePartnerAction(partnerId: string) {
  await db.delete(schema.partners).where(eq(schema.partners.id, partnerId));
  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}
