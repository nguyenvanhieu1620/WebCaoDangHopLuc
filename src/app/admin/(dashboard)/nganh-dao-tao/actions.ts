"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils";

export async function upsertProgramAction(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const duration = String(formData.get("duration") || "").trim();
  const intake = Number(formData.get("intake") || 0);
  const summary = String(formData.get("summary") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const featured = formData.get("featured") === "on";

  if (!code || !name || !duration || !summary || !intake) return;

  if (id) {
    await db
      .update(schema.programs)
      .set({
        code,
        name,
        duration,
        intake,
        summary,
        content: content || null,
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
      duration,
      intake,
      summary,
      content: content || null,
      featured: featured ? 1 : 0,
    });
  }

  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");
}

export async function deleteProgramAction(programId: string) {
  await db.delete(schema.programs).where(eq(schema.programs.id, programId));
  revalidatePath("/admin/nganh-dao-tao");
  revalidatePath("/");
  revalidatePath("/nganh-dao-tao");
}
