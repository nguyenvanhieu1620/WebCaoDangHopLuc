"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export async function upsertEventAction(formData: FormData) {
  await requirePermission("events");
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const startAt = String(formData.get("startAt") || "").trim();
  const endAt = String(formData.get("endAt") || "").trim();
  const titleEn = String(formData.get("titleEn") || "").trim();
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const locationEn = String(formData.get("locationEn") || "").trim();

  if (!title || !startAt) return;

  const current = id
    ? await db.query.events.findFirst({ where: eq(schema.events.id, id) })
    : null;
  const coverImageUrl = await resolveImageUrl(
    formData,
    "coverImage",
    "coverImageExisting",
    current?.coverImageUrl ?? null
  );

  const [titleEnFinal, descriptionEnFinal, locationEnFinal] = await autoFillTranslations([
    { vi: title, en: titleEn },
    { vi: description, en: descriptionEn },
    { vi: location, en: locationEn },
  ]);

  const values = {
    title,
    titleEn: titleEnFinal || null,
    description: description || null,
    descriptionEn: descriptionEnFinal || null,
    location: location || null,
    locationEn: locationEnFinal || null,
    startAt: new Date(startAt).toISOString(),
    endAt: endAt ? new Date(endAt).toISOString() : null,
    coverImageUrl,
  };

  if (id) {
    await db.update(schema.events).set(values).where(eq(schema.events.id, id));
  } else {
    await db.insert(schema.events).values(values);
  }

  revalidatePath("/admin/su-kien");
  revalidatePath("/su-kien");
  revalidatePath("/");
}

export async function deleteEventAction(eventId: string) {
  await requirePermission("events");
  await db.delete(schema.events).where(eq(schema.events.id, eventId));
  revalidatePath("/admin/su-kien");
  revalidatePath("/su-kien");
  revalidatePath("/");
}
