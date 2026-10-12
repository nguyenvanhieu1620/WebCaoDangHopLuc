"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

/**
 * Error boundary gốc — bắt lỗi runtime không lường trước (khác `not-found.tsx`,
 * vốn xử lý URL/nội dung không tồn tại). Bắt buộc là Client Component theo
 * yêu cầu của Next.js. `reset()` thử render lại route hiện tại từ đầu.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <Image
        src="/images/logo.png"
        alt={SITE.fullName}
        width={1137}
        height={315}
        className="mb-6 h-14 w-auto"
      />
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-600">
        Có lỗi xảy ra
      </div>
      <h1 className="mt-3 font-display text-[28px] font-semibold leading-tight text-brand-900">
        Trang gặp sự cố
      </h1>
      <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
        Đã có lỗi ngoài ý muốn xảy ra. Thử tải lại trang, hoặc quay về trang
        chủ nếu vẫn tiếp tục gặp lỗi.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-red transition-all duration-200 hover:-translate-y-0.5"
        >
          Thử lại
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-brand-700 px-6 py-3.5 text-sm font-bold text-brand-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:text-white"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
