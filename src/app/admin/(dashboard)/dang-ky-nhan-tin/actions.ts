"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/admin-auth";

export async function deleteNewsletterSubscriberAction(subscriberId: string) {
  await requirePermission("admissions-contact");
  await db.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, subscriberId));
  revalidatePath("/admin/dang-ky-nhan-tin");
  revalidatePath("/admin");
}
