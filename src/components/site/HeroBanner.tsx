"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CountUp } from "@/components/site/CountUp";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  caption: string | null;
  linkUrl: string | null;
};

type HeroBannerProps = {
  slides: HeroSlide[];
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  stats: { value: string; label: string }[];
};

/** Thời gian mỗi banner hiện trước khi tự chuyển — khớp thời lượng thanh tiến trình (CSS `hero-progress`). */
const INTERVAL_MS = 6500;

/**
 * Banner chính Trang chủ — TRÀN TOÀN MÀN HÌNH, là "bộ mặt" của website:
 * ảnh banner (bảng `hero_banners`, quản lý ở admin/banner-trang-chu) phủ kín
 * khối, chữ Hero + nút CTA (lấy từ Nội dung Trang chủ) nằm đè lên phía trái
 * trên lớp phủ gradient xanh đậm để luôn đọc được bất kể ảnh sáng/tối.
 *
 * Nhiều banner: crossfade 1,4s + mọi ảnh "thở" chậm (Ken Burns, CSS thuần,
 * chạy liên tục nên không bị giật khi đổi ảnh), thanh tiến trình theo từng
 * banner, nút ←/→, tạm dừng, bộ đếm "01 / 03", chú thích + link của banner
 * đang hiện. `prefers-reduced-motion` → không tự chuyển, không Ken Burns.
 * Banner đang ẩn có `inert` + `aria-hidden` (không nhận focus/đọc màn hình).
 */
export function HeroBanner({ slides, badge, titleLine1, titleLine2, description, stats }: HeroBannerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;
  const current = slides[index] ?? slides[0];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    const frame = requestAnimationFrame(update);
    preference.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      preference.removeEventListener("change", update);
    };
  }, []);

  // Hẹn giờ theo từng lượt (gắn với `index`) — bấm chuyển tay thì đếm lại từ đầu.
  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, count, paused, reducedMotion]);

  const go = (next: number) => setIndex((next + count) % count);
  const autoplay = count > 1 && !paused && !reducedMotion;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner giới thiệu nhà trường"
      className="relative isolate overflow-hidden bg-brand-900 text-white"
    >
      {/* Desktop: cao gần trọn màn hình (trừ header); mobile: cao theo nội dung để chữ không đè thanh điều khiển. */}
      <div className="relative flex min-h-[640px] flex-col lg:h-[calc(100svh-104px)] lg:max-h-[880px]">
        {/* Ảnh nền */}
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            inert={i !== index}
            aria-hidden={i !== index}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.caption || `Ảnh banner ${i + 1}`}
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn("object-cover", !reducedMotion && "hero-kenburns")}
              style={{ animationDelay: `${-i * 4}s` }}
            />
          </div>
        ))}

        {/* Lớp phủ: đậm bên trái (chữ) + đáy (thanh điều khiển), nhạt dần sang phải để lộ ảnh */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/70 to-brand-900/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/20 to-transparent" />
        <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-accent-500/20 blur-[100px]" />

        {/* Nội dung */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-end px-6 pb-56 pt-20 sm:px-8 sm:pb-48 lg:justify-center lg:pb-48">
          <div className="hero-rise max-w-[720px]">
            <Eyebrow tone="onDark">{badge}</Eyebrow>
            <h1 className="mt-6 text-balance font-display text-[42px] font-bold leading-[1.04] tracking-tight sm:text-[60px] lg:text-[74px]">
              {titleLine1}{" "}
              <em className="block bg-gradient-to-r from-accent-500 via-accent-400 to-accent-200 bg-clip-text pb-1 font-medium italic text-transparent">
                {titleLine2}
              </em>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/80 sm:text-[17.5px]">{description}</p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Button href="/tuyen-sinh">Đăng ký xét tuyển</Button>
              <Button href="/nganh-dao-tao" variant="ghostLight" className="backdrop-blur-md">
                Khám phá ngành học →
              </Button>
            </div>
            {stats.length > 0 && (
              <dl className="mt-10 hidden gap-8 sm:flex">
                {stats.map((s, i) => (
                  <div key={s.label} className={cn(i > 0 && "border-l border-white/20 pl-8")}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-mono text-[30px] font-semibold leading-none text-white">
                      <CountUp value={s.value} />
                    </dd>
                    <dd className="mt-1.5 text-[12.5px] text-white/65">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Thanh dưới: chú thích banner + điều khiển */}
        <div className="absolute inset-x-0 bottom-16 z-10 sm:bottom-20">
          {/* Mobile: chú thích trên, nút điều khiển dưới, căn trái (bên phải có nút liên hệ nhanh cố định). */}
          <div className="mx-auto flex max-w-[1320px] flex-col items-start gap-4 px-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-8">
            <div className="min-w-0" aria-live="polite">
              {count > 1 && (
                <div className="font-mono text-[11px] tracking-[0.2em] text-white/60">
                  <span className="text-white">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
                </div>
              )}
              {current?.caption && (
                <div className="mt-1.5 flex max-w-[460px] flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-white/85">
                  <span className="truncate">{current.caption}</span>
                  {current.linkUrl && (
                    <Link href={current.linkUrl} className="shrink-0 font-semibold text-white underline-offset-4 hover:underline">
                      Xem chi tiết →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {count > 1 && (
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden items-center gap-1.5 sm:flex">
                  {slides.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Banner ${i + 1}`}
                      aria-current={i === index ? "true" : undefined}
                      className="group relative h-8 w-10 lg:w-14"
                    >
                      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25 group-hover:bg-white/40">
                        {i === index && (
                          <span
                            key={`${index}-${autoplay}`}
                            className={cn("absolute inset-y-0 left-0 rounded-full bg-white", autoplay ? "hero-progress" : "w-full")}
                            style={autoplay ? { animationDuration: `${INTERVAL_MS}ms` } : undefined}
                          />
                        )}
                        {i < index && <span className="absolute inset-0 rounded-full bg-white/60" />}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPaused((v) => !v)}
                  aria-label={paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"}
                  aria-pressed={paused}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  {paused ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Banner trước"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Banner tiếp theo"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-900 shadow-lg2 transition-transform hover:scale-105"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
