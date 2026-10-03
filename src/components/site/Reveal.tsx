"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /**
   * Trễ (ms) trước khi bắt đầu chạy lên, tính từ lúc phần tử chạm khung nhìn —
   * dùng để so le nhiều phần tử liền nhau (VD `delay={i * 90}` trong 1 lưới thẻ),
   * giống `data-wow-delay` của VinUni.
   */
  delay?: number;
};

/**
 * "Đi đến đâu chữ chạy lên đến đấy" — đúng cơ chế WOW.js `fadeInUp` của
 * VinUni: phần tử ẨN sẵn; khi mép trên vừa chạm vào khung nhìn thì chạy lên +
 * rõ dần trong ~1 giây (CSS `.reveal` → `.reveal-in` trong globals.css), mỗi
 * phần tử chạy đúng 1 lần. Quãng trượt = chiều cao phần tử, tối đa 64px (dòng
 * chữ trượt đúng 1 dòng như VinUni, thẻ lớn không bay quá xa).
 *
 * Bản cũ có 2 lỗi khiến hiệu ứng gần như không thấy: (1) hẹn giờ dự phòng 2s
 * cho hiện TẤT CẢ phần tử kể cả phần chưa cuộn tới — cuộn chậm hơn 2s là mọi thứ
 * đã hiện sẵn; (2) độ hiện bám % vị trí cuộn nên dừng tay là chữ dừng lửng lơ.
 *
 * Dự phòng giữ lại nhưng CHỈ cho phần tử đã nằm trong khung nhìn (VD tab mở nền,
 * IntersectionObserver chưa bắn) — tránh nội dung đang trước mắt bị kẹt vô hình,
 * còn phần chưa cuộn tới vẫn chờ cuộn tới mới chạy lên.
 * Tôn trọng `prefers-reduced-motion` (hiện ngay, không chuyển động).
 */
/** Tổ tiên gần (tối đa 4 cấp) đang cuộn ngang — `overflow-x: auto|scroll`. */
function horizontalScroller(el: HTMLElement): HTMLElement | null {
  let p = el.parentElement;
  for (let i = 0; p && i < 4; i++, p = p.parentElement) {
    const ox = getComputedStyle(p).overflowX;
    if (ox === "auto" || ox === "scroll") return p;
  }
  return null;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setShown(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // setState qua rAF (không gọi thẳng trong thân effect — rule react-hooks/set-state-in-effect).
      const raf = requestAnimationFrame(show);
      return () => cancelAnimationFrame(raf);
    }

    // Nằm trong dải cuộn NGANG (slider ngành, thẻ vuốt trên mobile): thẻ khuất bên
    // phải bị dải cắt nên không bao giờ "giao" khung nhìn tới khi lướt tới — sẽ
    // trống trơn lúc lướt. Như WOW.js (chỉ xét chiều dọc): theo dõi chính dải đó,
    // dải chạm màn hình thì mọi thẻ cùng chạy lên (so le theo `delay`).
    const target = horizontalScroller(el) ?? el;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      // Lùi mép dưới 6%: chạy khi phần tử đã lấp ló trong màn hình, người xem kịp thấy nó chạy lên.
      { rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(target);

    const fallback = window.setTimeout(() => {
      const r = target.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      if (r.top < vh && r.left < vw && r.right > 0) show();
    }, 1500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", shown && "reveal-in", className)}
    >
      {children}
    </div>
  );
}
