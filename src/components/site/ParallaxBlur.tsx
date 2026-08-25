"use client";

import { useEffect, useRef } from "react";

type ParallaxBlurProps = {
  className: string;
  /** Hệ số lệch tốc độ so với cuộn — 0.1-0.25 là mức "nhẹ", âm/dương quyết định hướng lệch. */
  speed?: number;
};

/**
 * Bọc 1 khối blur trang trí (VD trong `DecorativeSection`, Hero Trang chủ)
 * để nó di chuyển LỆCH TỐC ĐỘ so với nội dung chính khi cuộn — tạo cảm giác
 * chiều sâu (parallax) nhẹ, không thêm thư viện ngoài. Cùng cơ chế hiệu
 * năng với `Reveal.tsx`: `IntersectionObserver` chỉ bật/tắt 1 scroll
 * listener khi khối đang gần khung nhìn, throttle qua `requestAnimationFrame`.
 * Tôn trọng `prefers-reduced-motion` — đứng yên nếu người dùng bật cờ này.
 */
export function ParallaxBlur({ className, speed = 0.15 }: ParallaxBlurProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const distFromCenter = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = `translateY(${-distFromCenter * speed}px)`;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          update();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "25% 0px 25% 0px" }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [speed]);

  return <div ref={ref} className={className} />;
}
