"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Trễ (ms) trước khi khối này bắt đầu hiện, so với vị trí cuộn bình
   * thường — dùng để so le nhiều khối/thẻ liền nhau (VD `delay={i * 90}`
   * trong 1 lưới thẻ). Không phải hẹn giờ (timer) — chuyển thành khoảng
   * cách cuộn cần đi thêm, nên độ so le vẫn khớp đúng tốc độ tay cuộn thay
   * vì lệch pha với các khối không so le.
   */
  delay?: number;
};

/**
 * Bọc 1 khối nội dung để nó mờ/trượt nhẹ lên theo % THỰC TẾ đã cuộn vào
 * khung nhìn — mượt liên tục theo đúng tốc độ tay cuộn, khác bản đầu tiên
 * (bật/tắt nhị phân theo có giao nhau với khung nhìn hay không, cảm giác
 * "giật hiện" thay vì chảy mượt). Thuần CSS/JS, không thêm thư viện ngoài.
 *
 * Cách làm: IntersectionObserver CHỈ dùng để bật/tắt 1 scroll listener khi
 * phần tử đang ở gần khung nhìn (tránh mỗi Reveal đều có scroll listener
 * chạy suốt vòng đời trang — trang có hàng chục Reveal cùng lúc sẽ tốn hiệu
 * năng nếu tất cả đều luôn lắng nghe). Trong lúc "đang gần", scroll
 * listener (throttle qua requestAnimationFrame) tính % dựa trên
 * `getBoundingClientRect()` thật mỗi khung hình — bám sát đúng vị trí cuộn,
 * không nhảy theo bậc rời rạc.
 *
 * Tôn trọng `prefers-reduced-motion` — tắt hẳn hiệu ứng, hiện ngay nội dung.
 *
 * Vẫn giữ hẹn giờ dự phòng 2s: nếu vì lý do gì đó không bao giờ tính được
 * tiến trình (VD tab mở nền chưa từng hiện lên) thì tự hiện đủ 100% — tránh
 * nội dung bị kẹt vô hình vĩnh viễn (bài học từ bản đầu tiên, xem CLAUDE.md).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doneRef.current = true;
      // setState qua rAF thay vì gọi thẳng trong thân effect — tránh cảnh
      // báo "setState đồng bộ trong effect" của react-hooks/set-state-in-effect.
      const raf = requestAnimationFrame(() => setProgress(1));
      return () => cancelAnimationFrame(raf);
    }

    // delay (ms) -> khoảng cách cuộn thêm (px) để tính so le theo vị trí, không phải theo thời gian.
    const delayPx = delay * 0.35;

    let rafId: number | null = null;

    const computeProgress = () => {
      rafId = null;
      if (doneRef.current) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const start = vh * 0.92 - delayPx;
      const end = vh * 0.55 - delayPx;
      const raw = (start - rect.top) / (start - end);
      const clamped = Math.min(1, Math.max(0, raw));
      setProgress(clamped);
      if (clamped >= 1) doneRef.current = true;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(computeProgress);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          computeProgress();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "15% 0px 15% 0px" }
    );
    io.observe(el);

    const fallback = setTimeout(() => {
      doneRef.current = true;
      setProgress(1);
    }, 2000);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 28}px)`,
      }}
      className={cn("will-change-[opacity,transform]", className)}
    >
      {children}
    </div>
  );
}
