"use server";

import { translateTexts, MAX_TRANSLATION_CHARACTERS } from "@/lib/translate";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import { canTranslate } from "@/lib/admin-permissions";
import { checkRateLimit } from "@/lib/rate-limit";

export type TranslateResult = { ok: true; texts: string[] } | { ok: false; error: string };

/** Server Action cho nút "Dịch tự động sang tiếng Anh" trong admin — gọi từ AutoTranslateButton. */
export async function translateFieldsAction(texts: string[]): Promise<TranslateResult> {
  const user = await getCurrentAdminUser();
  if (!user || !canTranslate(user)) {
    return { ok: false, error: "Bạn cần đăng nhập bằng tài khoản có quyền chỉnh sửa nội dung để sử dụng dịch tự động." };
  }
  if (!Array.isArray(texts) || texts.length > 64 || texts.some((text) => typeof text !== "string") || texts.reduce((total, text) => total + text.length, 0) > MAX_TRANSLATION_CHARACTERS) {
    return { ok: false, error: "Nội dung dịch không hợp lệ hoặc quá dài (tối đa 20.000 ký tự)." };
  }
  if (!checkRateLimit(`translate:${user.id}`, 10, 60_000)) {
    return { ok: false, error: "Bạn dịch quá nhiều lần, vui lòng đợi một phút rồi thử lại." };
  }
  try {
    const translated = await translateTexts(texts);
    return { ok: true, texts: translated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lỗi không xác định." };
  }
}
