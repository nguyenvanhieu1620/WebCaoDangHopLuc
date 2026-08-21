"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function upsertPartnerAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!name) return;

  if (id) {
    await db.update(schema.partners).set({ name, sortOrder }).where(eq(schema.partners.id, id));
  } else {
    await db.insert(schema.partners).values({ name, sortOrder });
  }

  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}

export async function deletePartnerAction(partnerId: string) {
  await db.delete(schema.partners).where(eq(schema.partners.id, partnerId));
  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}
