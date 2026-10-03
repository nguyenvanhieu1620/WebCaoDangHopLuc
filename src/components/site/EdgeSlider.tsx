"use client";

import { Children, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Slider thẻ "tràn mép" kiểu VinUni (khối "Tại sao chọn VinUni"): thẻ đầu
 * thẳng lề nội dung (container 1320px), dải thẻ chạy tràn ra sát mép phải màn
 * hình nên thẻ cuối lộ 1 phần — gợi ý còn nữa. Dùng cuộn ngang GỐC của trình
 * duyệt (scroll-snap) nên vuốt cảm ứng/trackpad/bàn phím chạy sẵn; thêm:
 * nút ‹ › (cuộn đúng 1 thẻ), kéo bằng chuột, thanh tiến trình.
 *
 * Lề trái = `max(gutter, (100% - 1320px)/2)` — khớp `mx-auto max-w-[1320px]`
 * + `px-6 sm:px-8` của các khối khác trên Trang chủ.
 */
const EDGE_PAD = "px-[max(1.5rem,calc((100%-1320px)/2))] sm:px-[max(2rem,calc((100%-1320px)/2))]";
const EDGE_SCROLL_PAD = "scroll-pl-[max(1.5rem,calc((100%-1320px)/2))] sm:scroll-pl-[max(2rem,calc((100%-1320px)/2))]";

export function EdgeSlider({
  children,
  label,
  itemClassName,
  onDark,
}: {
  children: ReactNode;
  /** Tên vùng cho trình đọc màn hình, VD "Danh sách ngành đào tạo". */
  label: string;
  /** Độ rộng mỗi thẻ, VD "w-[82%] sm:w-[46%] lg:w-[31%]". */
  itemClassName: string;
  onDark?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const items = Children.toArray(children);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 1);
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function step(dir: 1 | -1) {
    const el = track.current;
    const first = el?.querySelector<HTMLElement>("[data-edge-item]");
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  }

  // Kéo bằng chuột (cảm ứng đã có cuộn gốc). Tắt snap trong lúc kéo cho mượt,
  // thả ra bật lại để tự hít vào thẻ gần nhất; kéo quá 6px thì chặn click (khỏi mở nhầm link).
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.scrollSnapType = "none";
      el.style.cursor = "grabbing";
    }
    if (d.moved) el.scrollLeft = d.left - dx;
  }
  function endDrag() {
    const el = track.current;
    const d = drag.current;
    drag.current = null;
    if (!el || !d?.moved) return;
    el.style.scrollSnapType = "";
    el.style.cursor = "";
    // Click ngay sau khi thả (trên link trong thẻ) bị chặn 1 lần.
    const block = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    };
    el.addEventListener("click", block, { capture: true, once: true });
    setTimeout(() => el.removeEventListener("click", block, { capture: true }), 50);
  }

  const btn = cn(
    "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-35",
    onDark
      ? "border-white/40 text-white enabled:hover:border-white enabled:hover:bg-white enabled:hover:text-brand-900"
      : "border-accent-600 text-accent-600 enabled:hover:bg-accent-600 enabled:hover:text-white"
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "no-scrollbar flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pt-3",
          EDGE_PAD,
          EDGE_SCROLL_PAD
        )}
      >
        {items.map((child, i) => (
          <div key={i} data-edge-item className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-[1320px] items-center gap-6 px-6 sm:px-8">
        <div className={cn("relative h-[3px] flex-1 overflow-hidden rounded-full", onDark ? "bg-white/15" : "bg-brand-900/10")} aria-hidden="true">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-600 to-accent-500 transition-[width] duration-200"
            style={{ width: `${Math.max(12, progress * 100)}%` }}
          />
        </div>
        <div className="flex shrink-0 gap-2.5">
          <button type="button" aria-label="Trước" onClick={() => step(-1)} disabled={edges.start} className={btn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label="Tiếp theo" onClick={() => step(1)} disabled={edges.end} className={btn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
