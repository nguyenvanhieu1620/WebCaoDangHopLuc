"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

export function FormActions({
  cancelHref,
  submitLabel = "Lưu",
  pendingLabel = "Đang lưu…",
}: {
  cancelHref: string;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
      >
        {pending && (
          <svg aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {pending ? pendingLabel : submitLabel}
      </button>
      <span role="status" className="sr-only">{pending ? pendingLabel : ""}</span>
      <Link href={cancelHref} className="rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-500 hover:text-brand-700">
        Huỷ
      </Link>
    </div>
  );
}
