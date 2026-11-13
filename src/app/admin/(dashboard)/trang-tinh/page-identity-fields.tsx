"use client";

import { useRef, useState } from "react";
import { slugify, staticPageHref } from "@/lib/utils";

const inputClass = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

export function PageIdentityFields({ initialTitle = "", existingSlug }: { initialTitle?: string; existingSlug?: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState("");
  const slugInput = useRef<HTMLInputElement>(null);
  const candidate = slugify(slug.trim() || title);
  const publicHref = staticPageHref(candidate);
  const hasSlug = /[a-z0-9]/.test(candidate);
  const canSuggest = hasSlug && !candidate.startsWith("cong-khai-");

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="f-trang-tinh-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
        <input
          id="f-trang-tinh-title"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
          placeholder="VD: Giới thiệu"
        />
      </div>
      {existingSlug !== undefined ? (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">Slug</span>
          <div className="break-all rounded-lg border border-line bg-paper-alt px-3 py-2.5 font-mono text-sm text-ink-faint">{existingSlug}</div>
        </div>
      ) : (
        <div>
          <label htmlFor="f-trang-tinh-slug" className="mb-1.5 block text-xs font-semibold text-ink-soft">Slug (để trống để tạo từ tiêu đề)</label>
          <input
            ref={slugInput}
            id="f-trang-tinh-slug"
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            aria-describedby="static-page-slug-help"
            className={inputClass}
            placeholder="VD: cong-khai-hoc-phi"
          />
          <p id="static-page-slug-help" className="mt-2 text-xs leading-relaxed text-ink-soft">
            Dùng tiền tố <code>cong-khai-</code> để trang xuất hiện trong mục Công khai. Slug trùng sẽ được thêm số thứ tự.
          </p>
          {canSuggest && (
            <button
              type="button"
              className="min-h-11 text-left text-xs font-semibold text-brand-700 underline hover:text-brand-900"
              onClick={() => {
                setSlug(`cong-khai-${candidate.replace(/^-+/, "")}`);
                slugInput.current?.focus();
              }}
            >
              Dùng slug Công khai
            </button>
          )}
          <div aria-live="polite" className="mt-1 break-all text-xs leading-relaxed text-ink-soft">
            {publicHref && <p>Đường dẫn dự kiến <code className="font-semibold text-brand-700">{publicHref}</code></p>}
            {!publicHref && hasSlug && (
              <p>Slug dự kiến <code className="font-semibold">{candidate}</code>. Slug này chưa được gắn vào một mục trên web.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
