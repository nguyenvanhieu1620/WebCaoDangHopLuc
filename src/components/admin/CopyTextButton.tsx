"use client";

import { useState } from "react";

/** Nút nhỏ chép 1 đoạn chữ (VD đường dẫn `/uploads/…` của tệp trong Thư viện media) vào clipboard. */
export function CopyTextButton({ text, label = "Chép link", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Chép đường dẫn:", text);
        }
      }}
      className={className}
    >
      <span aria-live="polite">{copied ? "Đã chép ✓" : label}</span>
    </button>
  );
}
