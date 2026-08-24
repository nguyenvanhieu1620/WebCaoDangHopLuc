import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import type { Faq } from "@/lib/db/schema";
import { getLocale, pickLocale } from "@/lib/locale";

/** Câu hỏi thường gặp hiển thị ở /faq — quản lý qua admin/faq. */
export async function getFaqs(): Promise<Faq[]> {
  const [rows, locale] = await Promise.all([
    db.query.faqs.findMany({ orderBy: asc(schema.faqs.sortOrder) }),
    getLocale(),
  ]);
  return rows.map((f) => ({
    ...f,
    question: pickLocale(f.question, f.questionEn, locale),
    answer: pickLocale(f.answer, f.answerEn, locale),
  }));
}
