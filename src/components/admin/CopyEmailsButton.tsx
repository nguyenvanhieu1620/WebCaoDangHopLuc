"use client";

import { useState } from "react";

/** Nút copy toàn bộ email (nối bằng dấu phẩy) vào clipboard — dùng để dán qua Gmail/Outlook gửi hàng loạt. */
export function CopyEmailsButton({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(emails.join(", "));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
    >
      {copied ? "Đã sao chép!" : "Sao chép danh sách email"}
    </button>
  );
}
