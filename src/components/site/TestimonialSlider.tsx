"use client";

import { useEffect, useState, type PointerEvent } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { siteCopy } from "@/lib/site-copy";

export type TestimonialItem = {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarUrl: string | null;
};

const AUTOPLAY_MS = 8000;

/**
 * Khối "Cựu sinh viên nói gì" kiểu VinUni ("Our University Leaders"): dải
 * xanh đậm tràn ngang, ảnh chân dung khung vòm NỔI lên khỏi mép trên dải,
 * tên + vai trò + trích dẫn lớn, nút ‹ › đổi người. Các câu chuyện chuyển mờ
 * trong 300ms, xếp chồng để giữ chiều cao theo nội dung dài nhất.
 * Thanh tiến trình là đồng hồ tự chuyển 8s — dừng/tiếp tục cùng vị trí khi
 * rê vào phần đọc/ảnh hoặc dùng bàn phím; tắt khi bật giảm chuyển động.
 */
export function TestimonialSlider({ items, locale = "vi" }: { items: TestimonialItem[]; locale?: Locale }) {
  const t = siteCopy(locale);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = items.length;
  const activeIndex = index < count ? index : 0;
  const paused = hovering || keyboardActive || reducedMotion;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    const frame = requestAnimationFrame(update);
    mq.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", update);
    };
  }, []);

  if (count === 0) return null;
  const go = (next: number) => setIndex((next + count) % count);
  const pauseForReading = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") setHovering(true);
  };
  const resumeAfterReading = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") setHovering(false);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.alumniRegion}
      className="relative overflow-hidden py-20 sm:py-24"
      onPointerLeave={resumeAfterReading}
      // Bấm chuột/chạm cũng tạo focus; chỉ bàn phím mới giữ tạm dừng sau khi rời chuột.
      onPointerDownCapture={() => setKeyboardActive(false)}
      onKeyDownCapture={() => setKeyboardActive(true)}
      onFocusCapture={(e) => setKeyboardActive(e.target.matches(":focus-visible"))}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardActive(false);
      }}
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-6 sm:px-8">
        <SectionHeading eyebrow={t.alumni} eyebrowTone="red" title={t.alumniTitle} align="left" className="mb-0" />
        {count > 1 && (
          <div className="flex items-center gap-2.5">
            <span className="mr-2 font-mono text-[12px] tracking-[0.2em] text-ink-faint">
              <span className="text-brand-900">{String(activeIndex + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
            </span>
            {[
              { label: t.previousStory, step: -1, d: "M15 6l-6 6 6 6" },
              { label: t.nextStory, step: 1, d: "M9 6l6 6-6 6" },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                aria-label={b.label}
                onClick={() => go(activeIndex + b.step)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-600 text-accent-600 transition-colors hover:bg-accent-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <path d={b.d} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-8 sm:mt-10">
        {/* Dải xanh tràn ngang — bắt đầu thấp hơn 80px để ảnh chân dung nổi lên trên mép dải */}
        <div className="absolute inset-x-0 bottom-0 top-20 overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700">
          <div className="absolute left-0 top-1/2 hidden h-20 w-8 -translate-y-1/2 bg-accent-600/70 [clip-path:polygon(0_0,100%_50%,0_100%)] lg:block" />
          <div className="absolute -right-24 top-0 h-full w-[560px] bg-white/[0.03] [clip-path:polygon(45%_0,100%_0,55%_100%,0_100%)]" />
          <div className="absolute -right-56 top-0 h-full w-[560px] bg-white/[0.02] [clip-path:polygon(45%_0,100%_0,55%_100%,0_100%)]" />
        </div>

        <div className="relative mx-auto grid max-w-[1320px] px-6 sm:px-8" aria-live={paused ? "polite" : "off"}>
          {items.map((item, i) => {
            const active = i === activeIndex;
            const initial = item.name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";
            return (
              <div
                key={item.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${count}`}
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  "testimonial-slide col-start-1 row-start-1 grid min-w-0 items-end gap-5 lg:grid-cols-[1.3fr_1fr] lg:gap-8",
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                <div className="order-2 min-w-0 pb-12 pt-4 text-white sm:pb-14 lg:order-1 lg:pb-14 lg:pl-12 lg:pt-32">
                  <div onPointerEnter={pauseForReading} onPointerLeave={resumeAfterReading}>
                    <div className="break-words font-display text-[22px] font-semibold leading-[1.3] tracking-tight sm:text-[26px]">{item.name}</div>
                    <div className="mt-2 text-[13px] leading-relaxed text-brand-100/85 sm:text-[14px]">{item.role}</div>
                    <blockquote className="relative mt-6 max-w-2xl pl-8 sm:mt-7 sm:pl-10">
                      <span aria-hidden="true" className="absolute left-0 top-[-4px] select-none font-display text-[48px] leading-none text-accent-400 sm:text-[56px]">
                        &ldquo;
                      </span>
                      <p className="break-words text-pretty font-display text-[18px] italic leading-[1.7] text-white/95 sm:text-[21px]">{item.quote}</p>
                    </blockquote>
                  </div>
                  {count > 1 && (
                    <div className="mt-7 w-full max-w-xs" aria-hidden="true">
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-medium leading-relaxed text-white/75 sm:text-[12px]">
                        <span>{reducedMotion ? t.manualSlides : paused ? t.paused : t.autoAdvance}</span>
                        {!reducedMotion && <span>{AUTOPLAY_MS / 1000} {t.seconds}</span>}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                        {active && (
                          <span
                            className="testimonial-progress block h-full origin-left rounded-full bg-accent-400"
                            style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                            onAnimationEnd={(e) => {
                              // Một đồng hồ cho cả thanh và tự chuyển, tránh lệch thời gian sau khi tạm dừng.
                              if (e.animationName === "testimonialProgress" && !reducedMotion) go(activeIndex + 1);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="order-1 flex justify-center lg:order-2 lg:justify-end lg:pr-10">
                  <div
                    onPointerEnter={pauseForReading}
                    onPointerLeave={resumeAfterReading}
                    className="testimonial-portrait relative h-[300px] w-[240px] overflow-hidden rounded-t-full border-4 border-white/90 bg-gradient-to-br from-brand-500 to-brand-800 shadow-[0_30px_60px_-20px_rgba(6,50,90,0.6)] sm:h-[400px] sm:w-[310px]"
                  >
                    {item.avatarUrl ? (
                      <Image src={item.avatarUrl} alt={item.name} fill sizes="310px" className="object-cover object-top" />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[80px] font-semibold text-white/80 sm:text-[96px]">
                        {initial}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
