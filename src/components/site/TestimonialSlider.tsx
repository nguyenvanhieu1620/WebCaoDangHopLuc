"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

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
 * tên in hoa + vai trò + trích dẫn lớn, nút ‹ › đổi người. Mỗi lần đổi, chữ
 * trượt vào + ảnh phóng nhẹ (key theo index → CSS animation chạy lại).
 * Tự chuyển 8s/lần khi có ≥ 2 người — dừng khi rê chuột/focus vào khối và
 * khi người dùng bật giảm chuyển động. Chưa có ảnh → chữ cái đầu tên.
 */
export function TestimonialSlider({ items }: { items: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = items.length;
  const current = items[index] ?? items[0];

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

  useEffect(() => {
    if (count < 2 || hovering || reducedMotion) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, count, hovering, reducedMotion]);

  if (!current) return null;
  const go = (next: number) => setIndex((next + count) % count);
  const initial = current.name.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Câu chuyện cựu sinh viên"
      className="relative overflow-hidden py-24"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-6 sm:px-8">
        <SectionHeading eyebrow="Cựu sinh viên nói gì" eyebrowTone="red" title="Câu chuyện thành công" align="left" className="mb-0" />
        {count > 1 && (
          <div className="flex items-center gap-2.5">
            <span className="mr-2 font-mono text-[12px] tracking-[0.2em] text-ink-faint">
              <span className="text-brand-900">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
            </span>
            {[
              { label: "Câu chuyện trước", step: -1, d: "M15 6l-6 6 6 6" },
              { label: "Câu chuyện tiếp theo", step: 1, d: "M9 6l6 6-6 6" },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                aria-label={b.label}
                onClick={() => go(index + b.step)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent-600 text-accent-600 transition-colors hover:bg-accent-600 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <path d={b.d} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-6 sm:mt-12">
        {/* Dải xanh tràn ngang — bắt đầu thấp hơn 80px để ảnh chân dung nổi lên trên mép dải */}
        <div className="absolute inset-x-0 bottom-0 top-20 overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700">
          <div className="absolute left-0 top-1/2 hidden h-28 w-12 -translate-y-1/2 bg-accent-600 [clip-path:polygon(0_0,100%_50%,0_100%)] lg:block" />
          <div className="absolute -right-24 top-0 h-full w-[560px] bg-white/[0.05] [clip-path:polygon(45%_0,100%_0,55%_100%,0_100%)]" />
          <div className="absolute -right-56 top-0 h-full w-[560px] bg-white/[0.04] [clip-path:polygon(45%_0,100%_0,55%_100%,0_100%)]" />
        </div>

        <div className="relative mx-auto grid max-w-[1320px] items-end gap-4 px-6 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
          <div key={`t-${index}`} className="testimonial-text order-2 pb-14 pt-6 text-white lg:order-1 lg:pb-16 lg:pl-14 lg:pt-36" aria-live="polite">
            <div className="font-display text-[24px] font-bold uppercase tracking-wide sm:text-[28px]">{current.name}</div>
            <div className="mt-1 text-[14px] font-semibold text-brand-100/85">{current.role}</div>
            <blockquote className="relative mt-7 max-w-2xl pl-12">
              <span aria-hidden="true" className="absolute left-0 top-[-6px] font-display text-[64px] leading-none text-accent-400">
                &ldquo;
              </span>
              <p className="font-display text-[19px] italic leading-relaxed text-white/95 sm:text-[22px]">{current.quote}</p>
            </blockquote>
            {count > 1 && (
              <div className="mt-8 flex gap-1.5" aria-hidden="true">
                {items.map((it, i) => (
                  <span key={it.id} className={cn("h-1 rounded-full transition-all duration-500", i === index ? "w-8 bg-accent-500" : "w-3 bg-white/30")} />
                ))}
              </div>
            )}
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end lg:pr-10">
            <div
              key={`p-${index}`}
              className="testimonial-portrait relative h-[300px] w-[240px] overflow-hidden rounded-t-full border-4 border-white/90 bg-gradient-to-br from-brand-500 to-brand-800 shadow-[0_30px_60px_-20px_rgba(6,50,90,0.6)] sm:h-[400px] sm:w-[310px]"
            >
              {current.avatarUrl ? (
                <Image src={current.avatarUrl} alt={current.name} fill sizes="310px" className="object-cover object-top" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-[120px] font-bold text-white/90">
                  {initial}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
