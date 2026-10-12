"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { QuickContact } from "@/lib/db/schema";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { SOCIAL_BG, SocialIcon } from "@/components/ui/SocialIcon";

type QuickContactWidgetProps = {
  contacts: QuickContact[];
  locale: Locale;
};

const TEXT = {
  vi: {
    title: "Liên hệ với Hợp Lực",
    subtitle: "Chọn kênh để được tư vấn tuyển sinh",
    open: "Mở liên hệ nhanh",
    close: "Đóng liên hệ nhanh",
    callNow: "Bấm để gọi ngay",
    zalo: "Nhắn tin tư vấn qua Zalo",
    messenger: "Nhắn tin qua Messenger",
    fanpage: "Fanpage chính thức",
    sms: "Nhắn tin SMS",
    message: "Gửi câu hỏi cho nhà trường",
    chatbot: "Hỏi đáp tự động",
    link: "Mở liên kết",
  },
  en: {
    title: "Contact Hop Luc",
    subtitle: "Pick a channel for admissions advice",
    open: "Open quick contact",
    close: "Close quick contact",
    callNow: "Tap to call now",
    zalo: "Chat with us on Zalo",
    messenger: "Message us on Messenger",
    fanpage: "Official Facebook page",
    sms: "Send an SMS",
    message: "Send the college a question",
    chatbot: "Automated Q&A",
    link: "Open link",
  },
} as const;

/** Màu nền + biểu tượng theo `type` (không theo từng dòng dữ liệu) — loại lạ dùng kiểu `custom`. */
const TYPE_STYLE: Record<string, { className: string; icon: React.ReactNode }> = {
  hotline: {
    className: "bg-accent-600",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path
          d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  zalo: { className: SOCIAL_BG.zalo, icon: <SocialIcon network="zalo" size={18} /> },
  facebook: { className: SOCIAL_BG.facebook, icon: <SocialIcon network="facebook" size={18} /> },
  message: {
    className: "bg-brand-600",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  chatbot: {
    className: "bg-ai",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="4" y="8" width="16" height="12" rx="3" />
        <path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3" strokeLinecap="round" />
      </svg>
    ),
  },
  custom: {
    className: "bg-ink-soft",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path
          d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

/** "19006868" → "1900 6868", "0987115115" → "0987 115 115"; số khác giữ nguyên. */
function formatPhone(digits: string): string {
  if (/^1[89]00\d{4}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (/^0\d{9}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return digits;
}

/** Dòng mô tả dưới tên mỗi kênh — suy ra từ `type` + `href`, admin không cần nhập thêm. */
function contactSubtitle(c: QuickContact, t: (typeof TEXT)[Locale]): string {
  const href = c.href.trim();
  switch (c.type) {
    case "hotline": {
      const digits = href.replace(/^tel:/i, "").replace(/\D/g, "");
      // Tên hiển thị đã có sẵn số (VD "Gọi hotline 1900 6868") thì không lặp lại số.
      return !digits || c.label.replace(/\D/g, "").includes(digits) ? t.callNow : formatPhone(digits);
    }
    case "zalo":
      return t.zalo;
    case "facebook":
      return /^https?:\/\/(www\.)?(m\.me|messenger\.com)\//i.test(href) ? t.messenger : t.fanpage;
    case "message":
      return /^sms:/i.test(href) ? t.sms : t.message;
    case "chatbot":
      return t.chatbot;
    default:
      if (/^mailto:/i.test(href)) return href.replace(/^mailto:/i, "").split("?")[0] || t.link;
      try {
        return new URL(href).hostname.replace(/^www\./, "") || t.link;
      } catch {
        return t.link;
      }
  }
}

/**
 * Nút liên hệ nhanh nổi góc màn hình — hiện trên mọi trang công khai, danh sách quản lý qua
 * admin/lien-he-nhanh (bảng quick_contacts). Bấm nút chính (+) mở 1 thẻ "Liên hệ với Hợp Lực":
 * mỗi kênh 1 dòng (biểu tượng màu hãng + tên + mô tả ngắn), các dòng hiện so le. Đóng bằng nút ×,
 * phím Esc, bấm ra ngoài hoặc sau khi chọn 1 kênh. Không dùng backdrop-blur (thẻ nổi cố định trên
 * điện thoại — xem ghi chú hiệu năng ở CLAUDE.md).
 */
export function QuickContactWidget({ contacts, locale }: QuickContactWidgetProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const t = TEXT[locale];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (contacts.length === 0) return null;

  return (
    // Trên mobile nâng lên trên thanh MobileActionBar (dính đáy, ~72px) để không chồng nhau.
    // Khung ngoài `pointer-events-none`: thẻ đang ẩn vẫn chiếm chỗ phía trên nút, không được chặn
    // bấm vào nội dung trang / nút "Lên đầu trang" nằm dưới nó.
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-[92px] right-4 z-40 flex flex-col items-end sm:right-6 lg:bottom-6"
    >
      <div
        id={panelId}
        role="region"
        aria-label={t.title}
        inert={!open}
        className={cn(
          "mb-3 w-[min(300px,calc(100vw-32px))] origin-bottom-right overflow-hidden rounded-2xl bg-white shadow-lg2 ring-1 ring-line transition duration-300 ease-out motion-reduce:transition-none",
          open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        )}
      >
        <div className="border-b border-line px-4 py-3.5">
          <p className="font-display text-[15px] font-bold leading-tight text-ink">{t.title}</p>
          <p className="mt-1 text-[12px] leading-snug text-ink-faint">{t.subtitle}</p>
        </div>
        <ul className="max-h-[min(58svh,420px)] divide-y divide-line overflow-y-auto overscroll-contain">
          {contacts.map((c, i) => {
            const style = TYPE_STYLE[c.type] ?? TYPE_STYLE.custom;
            const isExternal = /^https?:\/\//i.test(c.href);
            return (
              <li
                key={c.id}
                style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                className={cn(
                  "transition duration-300 ease-out motion-reduce:transition-none",
                  open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                )}
              >
                <a
                  href={c.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
                      style.className
                    )}
                  >
                    {style.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold leading-tight text-ink">{c.label}</span>
                    <span className="mt-0.5 block truncate text-[12px] leading-tight text-ink-faint">
                      {contactSubtitle(c, t)}
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                    className="shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t.close : t.open}
        aria-expanded={open}
        aria-controls={panelId}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg2 transition hover:scale-105 hover:bg-brand-800"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className={cn("transition-transform duration-300", open && "rotate-45")}
        >
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
