"use server";

import { translateTexts } from "@/lib/translate";

export type TranslateResult = { ok: true; texts: string[] } | { ok: false; error: string };

/** Server Action cho nút "Dịch tự động sang tiếng Anh" trong admin — gọi từ AutoTranslateButton. */
export async function translateFieldsAction(texts: string[]): Promise<TranslateResult> {
  try {
    const translated = await translateTexts(texts);
    return { ok: true, texts: translated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lỗi không xác định." };
  }
}
