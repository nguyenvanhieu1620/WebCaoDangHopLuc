"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Trễ thêm (ms) trước khi hiện — dùng để so le nhiều khối liền nhau. */
  delay?: number;
};

/**
 * Bọc 1 khối nội dung để nó mờ/trượt nhẹ lên khi cuộn tới lần đầu (IntersectionObserver
 * thuần, không thêm thư viện ngoài). Chỉ chạy 1 lần — vào tầm nhìn rồi thì
 * ngắt observer, cuộn qua lại không lặp lại hiệu ứng.
 *
 * Có hẹn giờ dự phòng 2s: nếu observer vì lý do gì đó không bao giờ bắn (VD
 * tab mở nền chưa từng hiện lên, trình duyệt cũ không hỗ trợ) thì tự hiện
 * nội dung sau 2s — tránh nội dung bị kẹt vô hình vĩnh viễn (đã tái hiện
 * rủi ro này lúc test: `document.visibilityState === "hidden"` khiến
 * observer không bắn được).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => setVisible(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    const fallback = setTimeout(reveal, 2000);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
