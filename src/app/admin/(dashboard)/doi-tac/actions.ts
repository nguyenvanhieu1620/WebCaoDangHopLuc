"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { resolveImageUrl } from "@/lib/media";
import { redirect } from "next/navigation";

export async function upsertPartnerAction(formData: FormData) {
  await requirePermission("partners");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const nameEn = String(formData.get("nameEn") || "").trim();
  const rawWebsite = String(formData.get("websiteUrl") || "").trim().slice(0, 300);
  // Chỉ nhận link http(s) — chặn "javascript:" hoặc chuỗi lạ bị chèn vào href công khai.
  const websiteUrl = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : null;

  if (!name) return;

  const current = id ? await db.query.partners.findFirst({ where: eq(schema.partners.id, id) }) : null;
  const logoUrl =
    formData.get("removeLogo") === "on"
      ? null
      : await resolveImageUrl(formData, "logo", "logoExisting", current?.logoUrl ?? null);
  const [nameEnFinal] = await autoFillTranslations([{ vi: name, en: nameEn }]);

  if (id) {
    await db
      .update(schema.partners)
      .set({ name, nameEn: nameEnFinal || null, logoUrl, websiteUrl, sortOrder })
      .where(eq(schema.partners.id, id));
  } else {
    await db.insert(schema.partners).values({ name, nameEn: nameEnFinal || null, logoUrl, websiteUrl, sortOrder });
  }

  revalidatePath("/admin/doi-tac");
  revalidatePath("/");

  redirect("/admin/doi-tac");
}

export async function deletePartnerAction(partnerId: string) {
  await requirePermission("partners");
  await db.delete(schema.partners).where(eq(schema.partners.id, partnerId));
  revalidatePath("/admin/doi-tac");
  revalidatePath("/");
}
