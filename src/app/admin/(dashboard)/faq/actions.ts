"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import type { AdminSaveResult } from "@/lib/admin-form";

function revalidateFaqPages() {
  for (const path of ["/admin/faq", "/faq", "/tuyen-sinh", "/tim-kiem"]) revalidatePath(path);
}

export async function upsertFaqAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("faq");
  const id = String(formData.get("id") || "").trim();
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const questionEn = String(formData.get("questionEn") || "").trim();
  const answerEn = String(formData.get("answerEn") || "").trim();
  const visibility = formData.get("isVisible");

  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!question) fields.question = "Nhập câu hỏi.";
  if (!answer) fields.answer = "Nhập câu trả lời.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (visibility !== null && visibility !== "0" && visibility !== "1") {
    fields.isVisible = "Chọn trạng thái hiển thị.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu câu hỏi. Kiểm tra lại thông tin bên dưới.", fields };
  }

  const [questionEnFinal, answerEnFinal] = await autoFillTranslations([
    { vi: question, en: questionEn },
    { vi: answer, en: answerEn },
  ]);

  const values = {
    question,
    questionEn: questionEnFinal || null,
    answer,
    answerEn: answerEnFinal || null,
    sortOrder,
    isVisible: visibility === null ? undefined : Number(visibility),
  };
  if (id) {
    const [saved] = await db.update(schema.faqs).set(values).where(eq(schema.faqs.id, id)).returning({ id: schema.faqs.id });
    if (!saved) return { message: "Câu hỏi này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };
  } else {
    await db.insert(schema.faqs).values(values);
  }

  revalidateFaqPages();
  redirect("/admin/faq?saved=1");
}

export async function deleteFaqAction(faqId: string) {
  await requirePermission("faq");
  await db.delete(schema.faqs).where(eq(schema.faqs.id, faqId));
  revalidateFaqPages();
}
