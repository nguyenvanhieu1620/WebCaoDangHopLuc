"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFileIfPresent } from "@/lib/media";

export async function upsertTestimonialAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const quote = String(formData.get("quote") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);

  if (!quote || !name || !role) return;

  const current = id
    ? await db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, id) })
    : null;
  const avatarUrl = await saveUploadedFileIfPresent(formData, "avatar", current?.avatarUrl ?? null);

  if (id) {
    await db
      .update(schema.testimonials)
      .set({ quote, name, role, sortOrder, avatarUrl })
      .where(eq(schema.testimonials.id, id));
  } else {
    await db.insert(schema.testimonials).values({ quote, name, role, sortOrder, avatarUrl });
  }

  revalidatePath("/admin/danh-gia");
  revalidatePath("/");
}

export async function deleteTestimonialAction(testimonialId: string) {
  await db.delete(schema.testimonials).where(eq(schema.testimonials.id, testimonialId));
  revalidatePath("/admin/danh-gia");
  revalidatePath("/");
}
