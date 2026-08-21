"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function updateAdmissionStatusAction(
  submissionId: string,
  status: "new" | "reviewed" | "contacted"
) {
  await db
    .update(schema.admissionSubmissions)
    .set({ status })
    .where(eq(schema.admissionSubmissions.id, submissionId));

  revalidatePath("/admin/tuyen-sinh");
  revalidatePath("/admin");
}
