"use client";

import { useEffect, useRef, useState } from "react";

/** Tách phần số đầu chuỗi (VD "8.500" trong "8.500+") khỏi hậu tố (VD "+", "%"). */
function parseTarget(value: string): { number: number; suffix: string; hasThousands: boolean } {
  const match = value.match(/^([\d.,]+)(.*)$/);
  if (!match) return { number: 0, suffix: value, hasThousands: false };
  const [, numStr, suffix] = match;
  const hasThousands = numStr.includes(".") || numStr.includes(",");
  const number = parseInt(numStr.replace(/[.,]/g, ""), 10);
  return { number: Number.isNaN(number) ? 0 : number, suffix, hasThousands };
}

/**
 * Đếm tăng dần từ 0 tới giá trị thật (VD "12+", "8.500+", "96%") khi khối
 * vào tầm nhìn lần đầu — thuần IntersectionObserver + requestAnimationFrame,
 * không thêm thư viện ngoài. Giữ nguyên hậu tố (+, %...) trong suốt animation,
 * kết thúc luôn snap về đúng chuỗi gốc để không lệch định dạng.
 *
 * Có hẹn giờ dự phòng 2s: observer không bao giờ bắn (VD tab mở nền) thì tự
 * snap thẳng về giá trị thật, không đếm — tránh hiện "0" sai vĩnh viễn (rủi
 * ro thật đã gặp lúc test, xem ghi chú ở Reveal.tsx).
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => `0${parseTarget(value).suffix}`);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    function animate() {
      const { number, suffix, hasThousands } = parseTarget(value);
      const durationMs = 1300;
      const startTime = performance.now();

      function tick(now: number) {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const eased = 1 - (1 - progress) ** 3;
        const current = Math.round(eased * number);
        const formatted = hasThousands ? current.toLocaleString("vi-VN") : String(current);
        setDisplay(`${formatted}${suffix}`);
        if (progress < 1) raf = requestAnimationFrame(tick);
        else setDisplay(value);
      }
      raf = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        clearTimeout(fallback);
        observer.disconnect();
        animate();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    // Observer không bao giờ bắn (VD tab mở nền) thì snap thẳng, không đếm.
    const fallback = setTimeout(() => {
      observer.disconnect();
      setDisplay(value);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
