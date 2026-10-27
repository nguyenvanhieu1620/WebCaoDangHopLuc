"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";

export async function markContactMessageAction(messageId: string, status: "new" | "read") {
  await requirePermission("admissions-contact");
  if (status !== "new" && status !== "read") return;
  await db.update(schema.contactMessages).set({ status }).where(eq(schema.contactMessages.id, messageId));
  revalidatePath("/admin/lien-he");
  revalidatePath("/admin");
}

export async function deleteContactMessageAction(messageId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, messageId));
  revalidatePath("/admin/lien-he");
  revalidatePath("/admin");
}
