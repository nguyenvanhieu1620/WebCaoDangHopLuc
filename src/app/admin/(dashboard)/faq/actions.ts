"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";

export async function upsertFaqAction(formData: FormData) {
  await requirePermission("faq");
  const id = String(formData.get("id") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const questionEn = String(formData.get("questionEn") || "").trim();
  const answerEn = String(formData.get("answerEn") || "").trim();

  if (!question || !answer) return;

  const [questionEnFinal, answerEnFinal] = await autoFillTranslations([
    { vi: question, en: questionEn },
    { vi: answer, en: answerEn },
  ]);

  if (id) {
    await db
      .update(schema.faqs)
      .set({
        question,
        questionEn: questionEnFinal || null,
        answer,
        answerEn: answerEnFinal || null,
        sortOrder,
      })
      .where(eq(schema.faqs.id, id));
  } else {
    await db.insert(schema.faqs).values({
      question,
      questionEn: questionEnFinal || null,
      answer,
      answerEn: answerEnFinal || null,
      sortOrder,
    });
  }

  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaqAction(faqId: string) {
  await requirePermission("faq");
  await db.delete(schema.faqs).where(eq(schema.faqs.id, faqId));
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}
