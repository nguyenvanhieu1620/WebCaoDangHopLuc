"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Cuộn quá mốc này (px) mới hiện nút. */
const SHOW_AFTER = 600;
const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Nút "Lên đầu trang" kiểu VinUni — hiện khi đã cuộn xuống, viền tròn tô dần
 * theo % trang đã đọc. Đặt NGANG HÀNG bên trái nút liên hệ nhanh
 * (`QuickContactWidget`, 56px ở right-4/sm:right-6) để không chồng nhau, kể cả
 * trên mobile (cùng nằm trên thanh `MobileActionBar`).
 * Vòng tiến trình cập nhật thẳng vào DOM qua ref (không setState mỗi khung
 * hình cuộn); state chỉ đổi khi qua/lùi mốc hiện-ẩn.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, y / max) : 0;
      ringRef.current?.style.setProperty("stroke-dashoffset", String(CIRCUMFERENCE * (1 - progress)));
      setVisible(y > SHOW_AFTER);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "group fixed bottom-[98px] right-[84px] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand-800 shadow-lg2 ring-1 ring-line backdrop-blur-md transition-all duration-300 hover:bg-brand-800 hover:text-white sm:right-[92px] lg:bottom-[30px]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle
          ref={ringRef}
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          className="stroke-accent-600 transition-[stroke-dashoffset] duration-150 group-hover:stroke-white/70"
        />
      </svg>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
