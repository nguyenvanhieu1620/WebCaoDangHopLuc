"use client";

import { useState } from "react";
import type { QuickContact } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type QuickContactWidgetProps = {
  contacts: QuickContact[];
};

/**
 * Nút liên hệ nhanh nổi góc màn hình — hiện trên mọi trang công khai, danh
 * sách quản lý qua admin/lien-he-nhanh (bảng quick_contacts, không còn phụ
 * thuộc site_settings). Bấm nút chính (+) để xoè/thu các lựa chọn — mỗi mục
 * hiện ra so le nhẹ (transitionDelay tăng dần theo thứ tự).
 */
const TYPE_STYLE: Record<string, { className: string; icon: React.ReactNode }> = {
  hotline: {
    className: "bg-accent-600 hover:bg-accent-700",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  zalo: {
    className: "bg-[#0068FF] hover:bg-[#0055D4]",
    icon: <span className="font-display text-[13px] font-bold">Za</span>,
  },
  facebook: {
    className: "bg-[#1877F2] hover:bg-[#1461C7]",
    icon: <span className="font-display text-[15px] font-bold">f</span>,
  },
  message: {
    className: "bg-brand-600 hover:bg-brand-700",
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  chatbot: {
    className: "bg-[#7C3AED] hover:bg-[#6B2FD1]",
    icon: <span className="font-display text-[12px] font-bold">AI</span>,
  },
  custom: {
    className: "bg-ink-soft hover:bg-ink",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

export function QuickContactWidget({ contacts }: QuickContactWidgetProps) {
  const [open, setOpen] = useState(false);

  if (contacts.length === 0) return null;

  return (
    // Trên mobile nâng lên trên thanh MobileActionBar (dính đáy, ~72px) để không chồng nhau.
    <div className="fixed bottom-[92px] right-4 z-40 flex flex-col items-center gap-3 sm:right-6 lg:bottom-6">
      {contacts.map((c, i) => {
        const style = TYPE_STYLE[c.type] ?? TYPE_STYLE.custom;
        const isExternal = c.href.startsWith("http");
        return (
          <a
            key={c.id}
            href={c.href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            aria-label={c.label}
            title={c.label}
            tabIndex={open ? 0 : -1}
            style={{ transitionDelay: open ? `${i * 45}ms` : "0ms" }}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg2 transition-all duration-300",
              style.className,
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-3 scale-75 opacity-0"
            )}
          >
            {style.icon}
          </a>
        );
      })}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng liên hệ nhanh" : "Mở liên hệ nhanh"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg2 transition-transform hover:scale-105"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform duration-300", open && "rotate-45")}
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
