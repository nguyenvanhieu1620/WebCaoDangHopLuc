"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

/** Chỉ lưu lựa chọn trong bộ nhớ trang, không gửi thông tin giấy tờ lên máy chủ. */
export function DocumentChecklist({ items, locale }: { items: { id: string; title: string; detail: string | null }[]; locale: Locale }) {
  const [checked, setChecked] = useState<string[]>([]);
  const en = locale === "en";
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-brand-700">
        <p aria-live="polite">{en ? "Prepared" : "Đã chuẩn bị"}: {checked.length}/{items.length}</p>
        <button type="button" onClick={() => setChecked([])} className="rounded px-2 py-1 underline">{en ? "Reset checklist" : "Bỏ đánh dấu"}</button>
      </div>
      <progress aria-label={en ? "Document preparation progress" : "Tiến độ chuẩn bị hồ sơ"} value={checked.length} max={items.length || 1} className="mb-5 h-2 w-full accent-brand-700" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex h-full cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm transition-colors has-[:checked]:border-brand-300 has-[:checked]:bg-brand-50">
              <input type="checkbox" checked={checked.includes(item.id)} onChange={(e) => setChecked((old) => e.target.checked ? [...old, item.id] : old.filter((id) => id !== item.id))} className="mt-0.5 h-4 w-4 shrink-0 accent-brand-700" />
              <span>{item.title}{item.detail && <span className="mt-1 block text-xs text-ink-soft">{item.detail}</span>}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
