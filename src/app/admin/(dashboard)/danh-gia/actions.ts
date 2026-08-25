"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertTestimonialAction(formData: FormData) {
  await requirePermission("testimonials");
  const id = String(formData.get("id") || "").trim();
  const quote = String(formData.get("quote") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const quoteEn = String(formData.get("quoteEn") || "").trim();
  const roleEn = String(formData.get("roleEn") || "").trim();

  if (!quote || !name || !role) return;

  const current = id
    ? await db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, id) })
    : null;
  const avatarUrl = await resolveImageUrl(formData, "avatar", "avatarExisting", current?.avatarUrl ?? null);

  const [quoteEnFinal, roleEnFinal] = await autoFillTranslations([
    { vi: quote, en: quoteEn },
    { vi: role, en: roleEn },
  ]);

  if (id) {
    await db
      .update(schema.testimonials)
      .set({
        quote,
        quoteEn: quoteEnFinal || null,
        name,
        role,
        roleEn: roleEnFinal || null,
        sortOrder,
        avatarUrl,
      })
      .where(eq(schema.testimonials.id, id));
  } else {
    await db.insert(schema.testimonials).values({
      quote,
      quoteEn: quoteEnFinal || null,
      name,
      role,
      roleEn: roleEnFinal || null,
      sortOrder,
      avatarUrl,
    });
  }

  revalidatePath("/admin/danh-gia");
  revalidatePath("/");

  redirect("/admin/danh-gia");
}

export async function deleteTestimonialAction(testimonialId: string) {
  await requirePermission("testimonials");
  await db.delete(schema.testimonials).where(eq(schema.testimonials.id, testimonialId));
  revalidatePath("/admin/danh-gia");
  revalidatePath("/");
}
