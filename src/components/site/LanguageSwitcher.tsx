"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { setLocaleAction } from "@/lib/locale-actions";

/** Nút chuyển VI/EN — set cookie `locale` qua Server Action rồi refresh trang hiện tại. */
export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return (
    <div className={cn("flex items-center gap-1 font-mono font-semibold", className)}>
      <button
        type="button"
        onClick={() => choose("vi")}
        disabled={isPending}
        className={locale === "vi" ? "opacity-100" : "opacity-50 hover:opacity-80"}
      >
        VI
      </button>
      <span className="opacity-40">|</span>
      <button
        type="button"
        onClick={() => choose("en")}
        disabled={isPending}
        className={locale === "en" ? "opacity-100" : "opacity-50 hover:opacity-80"}
      >
        EN
      </button>
    </div>
  );
}
