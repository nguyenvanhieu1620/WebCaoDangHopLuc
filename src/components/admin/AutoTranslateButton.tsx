"use client";

import { useState, useTransition } from "react";
import { translateFieldsAction } from "@/lib/translate-actions";

type FieldPair = { viName: string; enName: string };

type FormElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Nút "Dịch tự động sang tiếng Anh" — đọc giá trị các field tiếng Việt
 * (`pairs[].viName`) trong <form> cha ngay lúc bấm, gọi DeepL, rồi điền
 * thẳng vào field tiếng Anh tương ứng (`pairs[].enName`) qua DOM (form ở
 * đây là uncontrolled — không cần state React, khớp pattern chung của admin).
 * KHÔNG tự lưu — admin vẫn phải xem lại rồi bấm nút Lưu như bình thường.
 */
export function AutoTranslateButton({ pairs, label }: { pairs: FieldPair[]; label?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.closest("form");
    if (!form) return;
    setError(null);

    const texts = pairs.map((p) => {
      const el = form.elements.namedItem(p.viName) as FormElement | null;
      return el?.value ?? "";
    });

    startTransition(async () => {
      const result = await translateFieldsAction(texts);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      pairs.forEach((p, i) => {
        const el = form.elements.namedItem(p.enName) as FormElement | null;
        if (el) el.value = result.texts[i];
      });
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-brand-500 px-3 py-1.5 text-[11.5px] font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
      >
        {isPending ? "Đang dịch..." : `🌐 ${label ?? "Dịch tự động sang tiếng Anh"}`}
      </button>
      {error && <p className="mt-1.5 text-[11px] text-accent-600">{error}</p>}
    </div>
  );
}
