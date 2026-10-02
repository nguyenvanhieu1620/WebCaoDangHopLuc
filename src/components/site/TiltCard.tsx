"use client";

import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

const CAN_TILT = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * Khung thẻ nghiêng 3D theo con trỏ + vệt sáng phản chiếu (glare) — tổng quát
 * hoá hiệu ứng của `ProgramCard` để dùng cho các thẻ khác (điểm mạnh, giảng
 * viên, tin tức, sự kiện) cho đồng bộ cảm giác chiều sâu toàn trang.
 * Phần tử con có class `tilt-pop` sẽ "nổi" lên khỏi mặt thẻ (translateZ) khi
 * hover — xem `globals.css` mục ".tilt-3d". Chỉ chạy trên thiết bị có chuột và
 * khi người dùng không bật giảm chuyển động; cảm ứng/giảm chuyển động giữ
 * thẻ phẳng như bình thường.
 */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  /** Góc nghiêng tối đa (độ). */
  max?: number;
}) {
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !window.matchMedia(CAN_TILT).matches) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    el.style.setProperty("--tilt-x", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--tilt-y", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--glare-x", `${x * 100}%`);
    el.style.setProperty("--glare-y", `${y * 100}%`);
  }
  function onLeave(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.style.setProperty("--tilt-x", "0deg");
    e.currentTarget.style.setProperty("--tilt-y", "0deg");
  }
  return (
    <div onPointerMove={onMove} onPointerLeave={onLeave} className={cn("tilt-3d group/tilt relative", className)}>
      {children}
      <span aria-hidden="true" className="tilt-glare" />
    </div>
  );
}
