"use server";

import { cookies } from "next/headers";
import type { Locale } from "@/lib/locale";

/** Đổi ngôn ngữ hiển thị — gọi từ LanguageSwitcher (client component). */
export async function setLocaleAction(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
