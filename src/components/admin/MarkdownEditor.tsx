"use client";

import { useRef, useState } from "react";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

type MarkdownEditorProps = {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
};

type ToolbarAction =
  | { type: "wrap"; before: string; after?: string }
  | { type: "line-prefix"; prefix: string }
  | { type: "link" };

const TOOLBAR: { label: string; title: string; action: ToolbarAction }[] = [
  { label: "B", title: "In đậm", action: { type: "wrap", before: "**" } },
  { label: "I", title: "In nghiêng", action: { type: "wrap", before: "*" } },
  { label: "H2", title: "Tiêu đề lớn", action: { type: "line-prefix", prefix: "## " } },
  { label: "H3", title: "Tiêu đề nhỏ", action: { type: "line-prefix", prefix: "### " } },
  { label: "❝", title: "Trích dẫn", action: { type: "line-prefix", prefix: "> " } },
  { label: "•", title: "Gạch đầu dòng", action: { type: "line-prefix", prefix: "- " } },
  { label: "1.", title: "Danh sách số", action: { type: "line-prefix", prefix: "1. " } },
  { label: "🔗", title: "Chèn liên kết", action: { type: "link" } },
];

/**
 * Ô soạn nội dung có định dạng (Markdown) — thay cho textarea trắng. Vẫn là
 * 1 <textarea name={name}> bình thường để FormData/Server Action đọc được
 * như cũ, chỉ thêm thanh công cụ chèn cú pháp Markdown + nút xem trước.
 * Hiển thị lại nội dung này ở trang công khai qua <MarkdownContent>.
 */
export function MarkdownEditor({
  name,
  defaultValue = "",
  rows = 10,
  placeholder,
  required,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  function applyAction(action: ToolbarAction) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);

    if (action.type === "wrap") {
      const after = action.after ?? action.before;
      const newValue =
        value.slice(0, selectionStart) + action.before + selected + after + value.slice(selectionEnd);
      el.value = newValue;
      el.focus();
      el.selectionStart = selectionStart + action.before.length;
      el.selectionEnd = selectionStart + action.before.length + selected.length;
      return;
    }

    if (action.type === "line-prefix") {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const newValue = value.slice(0, lineStart) + action.prefix + value.slice(lineStart);
      el.value = newValue;
      el.focus();
      const offset = action.prefix.length;
      el.selectionStart = selectionStart + offset;
      el.selectionEnd = selectionEnd + offset;
      return;
    }

    if (action.type === "link") {
      const url = window.prompt("Nhập URL:");
      if (!url) return;
      const label = selected || "liên kết";
      const snippet = `[${label}](${url})`;
      const newValue = value.slice(0, selectionStart) + snippet + value.slice(selectionEnd);
      el.value = newValue;
      el.focus();
      el.selectionStart = selectionStart + snippet.length;
      el.selectionEnd = selectionStart + snippet.length;
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-line bg-paper-alt px-2 py-1.5">
        {TOOLBAR.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onClick={() => applyAction(t.action)}
            className="flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[12.5px] font-bold text-ink-soft hover:bg-white hover:text-brand-700"
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              if (!showPreview && textareaRef.current) {
                setPreviewContent(textareaRef.current.value);
              }
              setShowPreview((v) => !v);
            }}
            className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 hover:bg-white"
          >
            {showPreview ? "← Soạn tiếp" : "Xem trước →"}
          </button>
        </div>
      </div>

      {/* Textarea luôn trong DOM (kể cả khi đang xem trước) để FormData không mất dữ liệu lúc submit — chỉ ẩn bằng CSS. */}
      <textarea
        ref={textareaRef}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-b-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500 ${
          showPreview ? "hidden" : ""
        }`}
      />
      {showPreview && (
        <div className="min-h-[160px] rounded-b-lg border border-line px-4 py-3">
          <MarkdownContent content={previewContent || "*(chưa có nội dung)*"} />
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-ink-faint">
        Hỗ trợ định dạng Markdown — dùng thanh công cụ phía trên hoặc gõ trực tiếp (VD: **đậm**, [chữ](link)).
      </p>
    </div>
  );
}
