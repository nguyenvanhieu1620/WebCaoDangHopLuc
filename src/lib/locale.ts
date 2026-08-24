import { cookies } from "next/headers";

export type Locale = "vi" | "en";

const COOKIE_NAME = "locale";

/** Đọc ngôn ngữ hiện tại từ cookie (mặc định "vi") — gọi được ở mọi Server Component/data layer. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "en" ? "en" : "vi";
}

/** Chọn bản dịch theo ngôn ngữ hiện tại — fallback về bản tiếng Việt nếu chưa có bản dịch. */
export function pickLocale(vi: string, en: string | null | undefined, locale: Locale): string {
  return locale === "en" && en ? en : vi;
}
