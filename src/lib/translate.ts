/**
 * Gọi DeepL API dịch Việt → Anh. Dùng ở 2 chỗ:
 * 1. Nút "Dịch tự động" trong admin (`AutoTranslateButton`) — admin chủ động bấm.
 * 2. Tự động điền khi Lưu (`autoFillTranslations`, gọi trong mọi `actions.ts`) —
 *    admin chỉ cần gõ tiếng Việt, ô tiếng Anh còn trống sẽ tự dịch ngay lúc lưu,
 *    không cần thao tác thêm. Ô nào admin đã tự gõ/sửa tay thì KHÔNG bị ghi đè.
 */

const TRANSLATE_TIMEOUT_MS = 15_000;

function endpointFor(apiKey: string): string {
  // Key DeepL Free có đuôi ":fx" — endpoint free/pro khác nhau, key nào endpoint đó.
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

/** Dịch nhiều đoạn text Việt → Anh trong 1 lần gọi API — giữ nguyên thứ tự, giữ nguyên chuỗi rỗng. */
export async function translateTexts(texts: string[]): Promise<string[]> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình DEEPL_API_KEY trong file .env — xem hướng dẫn lấy key miễn phí ở .env.example."
    );
  }

  const nonEmptyIndexes = texts
    .map((t, i) => (t.trim() ? i : -1))
    .filter((i) => i >= 0);
  if (nonEmptyIndexes.length === 0) return texts;

  const params = new URLSearchParams();
  for (const i of nonEmptyIndexes) params.append("text", texts[i]);
  params.set("source_lang", "VI");
  params.set("target_lang", "EN-US");

  let res: Response;
  try {
    res = await fetch(endpointFor(apiKey), {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      // DeepL treo thì bỏ — không giữ thao tác Lưu của admin chờ mãi (lỗi dịch không chặn việc lưu).
      signal: AbortSignal.timeout(TRANSLATE_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`DeepL không phản hồi sau ${TRANSLATE_TIMEOUT_MS / 1000} giây — thử dịch lại sau.`);
    }
    throw new Error("Không kết nối được tới DeepL — kiểm tra mạng của máy chủ rồi thử lại.");
  }

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("DEEPL_API_KEY không hợp lệ — kiểm tra lại key trong file .env.");
    }
    if (res.status === 456) {
      throw new Error("Đã dùng hết hạn mức dịch miễn phí trong tháng của DeepL.");
    }
    throw new Error(`Dịch tự động thất bại (DeepL trả về lỗi ${res.status}).`);
  }

  const data = (await res.json()) as { translations: { text: string }[] };
  const result = [...texts];
  nonEmptyIndexes.forEach((originalIndex, j) => {
    result[originalIndex] = data.translations[j].text;
  });
  return result;
}

/**
 * Tự điền bản dịch cho những field `en` đang rỗng (giữ nguyên field `en` nào
 * admin đã tự nhập — không ghi đè). Gọi trong mọi `actions.ts` lúc lưu, để
 * admin chỉ cần gõ tiếng Việt là web tự có bản tiếng Anh, không cần bấm nút.
 * Nếu chưa cấu hình `DEEPL_API_KEY` hoặc gọi API lỗi (hết quota, mất mạng...)
 * — trả về nguyên các field `en` cũ (rỗng), KHÔNG throw, để không chặn việc
 * lưu bài — nội dung vẫn hiện đúng nhờ fallback về tiếng Việt (`pickLocale`).
 */
export async function autoFillTranslations(
  pairs: { vi: string; en: string }[]
): Promise<string[]> {
  if (!process.env.DEEPL_API_KEY) return pairs.map((p) => p.en);

  const toTranslate = pairs
    .map((p, i) => (!p.en.trim() && p.vi.trim() ? i : -1))
    .filter((i) => i >= 0);
  if (toTranslate.length === 0) return pairs.map((p) => p.en);

  try {
    const translated = await translateTexts(toTranslate.map((i) => pairs[i].vi));
    const result = pairs.map((p) => p.en);
    toTranslate.forEach((originalIndex, j) => {
      result[originalIndex] = translated[j];
    });
    return result;
  } catch {
    return pairs.map((p) => p.en);
  }
}
