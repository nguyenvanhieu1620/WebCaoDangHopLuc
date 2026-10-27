"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";

export async function updateAdmissionStatusAction(
  submissionId: string,
  status: "new" | "reviewed" | "contacted"
) {
  await requirePermission("admissions-contact");
  if (!["new", "reviewed", "contacted"].includes(status)) return;
  await db
    .update(schema.admissionSubmissions)
    .set({ status })
    .where(eq(schema.admissionSubmissions.id, submissionId));

  revalidatePath("/admin/tuyen-sinh");
  revalidatePath("/admin");
}

export async function deleteAdmissionAction(submissionId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.admissionSubmissions).where(eq(schema.admissionSubmissions.id, submissionId));
  revalidatePath("/admin/tuyen-sinh");
  revalidatePath("/admin");
}
