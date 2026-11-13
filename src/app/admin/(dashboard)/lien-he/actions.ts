"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";
import { isContactStatus, type ContactStatus } from "./status";

export async function markContactMessageAction(messageId: string, status: ContactStatus, expectedStatus: ContactStatus) {
  await requirePermission("admissions-contact");
  if (!isContactStatus(status) || !isContactStatus(expectedStatus) || status === expectedStatus) return;
  await db.update(schema.contactMessages).set({ status }).where(and(
    eq(schema.contactMessages.id, messageId),
    eq(schema.contactMessages.status, expectedStatus),
  ));
  revalidatePath("/admin/lien-he");
  revalidatePath("/admin");
}

export async function deleteContactMessageAction(messageId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, messageId));
  revalidatePath("/admin/lien-he");
  revalidatePath("/admin");
}
