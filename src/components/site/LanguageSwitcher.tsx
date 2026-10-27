"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { setLocaleAction } from "@/lib/locale-actions";

/** Cờ SVG để hiển thị đồng nhất trên Windows/mobile, không phụ thuộc emoji của hệ điều hành. */
function LanguageFlag({ locale }: { locale: Locale }) {
  if (locale === "vi") {
    return (
      <svg viewBox="0 0 30 20" aria-hidden="true" className="h-4 w-6 overflow-hidden rounded-sm">
        <path fill="#DA251D" d="M0 0h30v20H0z" />
        <path fill="#FFFF00" d="m15 4 1.35 4.15h4.36l-3.53 2.56 1.35 4.15L15 12.3l-3.53 2.56 1.35-4.15-3.53-2.56h4.36z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="h-4 w-6 overflow-hidden rounded-sm">
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#FFF" strokeWidth="6" d="m0 0 60 30M60 0 0 30" />
      <path fill="#C8102E" d="M0 0v2l20 10h4zM60 0h-4L36 10h4zM0 30h4l20-10h-4zM60 30v-2L40 18h-4z" />
      <path stroke="#FFF" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  );
}

/** Nút chuyển ngôn ngữ — set cookie `locale` qua Server Action rồi refresh trang hiện tại. */
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
        aria-label="Tiếng Việt"
        title="Tiếng Việt"
        aria-pressed={locale === "vi"}
        onClick={() => choose("vi")}
        disabled={isPending}
        className={cn("flex h-5 w-8 items-center justify-center rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current", locale === "vi" ? "opacity-100 ring-1 ring-current" : "opacity-60 hover:opacity-100")}
      >
        <LanguageFlag locale="vi" />
      </button>
      <button
        type="button"
        aria-label="English"
        title="English"
        aria-pressed={locale === "en"}
        onClick={() => choose("en")}
        disabled={isPending}
        className={cn("flex h-5 w-8 items-center justify-center rounded p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current", locale === "en" ? "opacity-100 ring-1 ring-current" : "opacity-60 hover:opacity-100")}
      >
        <LanguageFlag locale="en" />
      </button>
    </div>
  );
}
