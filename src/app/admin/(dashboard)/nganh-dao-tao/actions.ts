"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function upsertProgramAction(formData: FormData) {
  await requirePermission("programs");
  const id = String(formData.get("id") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const duration = String(formData.get("duration") || "").trim();
  const intake = Number(formData.get("intake") || 0);
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const featured = formData.get("featured") === "on";
  const nameEn = String(formData.get("nameEn") || "").trim();
  const summaryEn = String(formData.get("summaryEn") || "").trim();
  const contentEn = String(formData.get("contentEn") || "").trim();

  if (!code || !name || !duration || !summary || !intake) return;

  const [nameEnFinal, summaryEnFinal, contentEnFinal] = await autoFillTranslations([
    { vi: name, en: nameEn },
    { vi: summary, en: summaryEn },
    { vi: content, en: contentEn },
  ]);

  if (id) {
    await db
      .update(schema.programs)
      .set({
        code,
        name,
        nameEn: nameEnFinal || null,
        duration,
        intake,
        summary,
        summaryEn: summaryEnFinal || null,
        content: content || null,
        contentEn: contentEnFinal || null,
        featured: featured ? 1 : 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.programs.id, id));
  } else {
    const baseSlug = slugify(name) || `nganh-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
    while (await db.query.programs.findFirst({ where: eq(schema.programs.slug, slug) })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    await db.insert(schema.programs).values({
      slug,
      code,
      name,
      nameEn: nameEnFinal || null,
      duration,
      intake,
      summary,
      summaryEn: summaryEnFinal || null,
      content: content || null,
      contentEn: contentEnFinal || null,
      featured: featured ? 1 : 0,
    });
  }

  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");

  redirect("/admin/nganh-dao-tao");
}

export async function deleteProgramAction(programId: string) {
  await requirePermission("programs");
  await db.delete(schema.programs).where(eq(schema.programs.id, programId));
  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");
}
