"use client";

import { Fragment, useEffect, useState } from "react";
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

const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

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
      className="relative isolate -mt-[72px] overflow-hidden bg-brand-900 text-white"
    >
      {/* Section kéo lên -72px để ảnh nằm DƯỚI thanh điều hướng trong suốt (SiteHeader cao 72px ở Trang chủ) —
          margin âm phải đặt trên CHÍNH section: section có overflow-hidden, đặt ở div con thì phần kéo lên bị cắt mất.
          Desktop: cao TỐI THIỂU gần trọn màn hình (trừ thanh thông báo ~33px, tối đa 940px) — dùng
          min-height chứ không cố định height: tiêu đề CMS dài xuống 3-4 dòng thì banner tự giãn,
          chữ/nút không bị tràn xuống đè chú thích + nút điều khiển ở đáy. Mobile: cao theo nội dung,
          ảnh hiện trọn ở đầu khối (không phủ kín → không bị cắt). */}
      <div className="relative flex min-h-[700px] flex-col lg:min-h-[min(calc(100svh-33px),940px)]">
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
            {/* ≥ lg: ảnh phủ kín banner. < lg: cùng ảnh đó phóng to + làm mờ làm nền (ảnh rõ nét hiện
                TRỌN trong khung 16:9 phía trên chữ — xem khối "Ảnh trọn vẹn" bên dưới). Cùng src + sizes
                nên trình duyệt chỉ tải 1 lần. */}
            <Image
              src={slide.imageUrl}
              alt={slide.caption || `Ảnh banner ${i + 1}`}
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn("hidden object-cover lg:block", !reducedMotion && "hero-kenburns")}
              style={{ animationDelay: `${-i * 4}s` }}
            />
            <Image src={slide.imageUrl} alt="" aria-hidden fill priority={i === 0} sizes="100vw" className="scale-110 object-cover blur-2xl lg:hidden" />
          </div>
        ))}

        {/* Lớp phủ: đậm bên trái (chữ) + đáy (thanh điều khiển), nhạt dần sang phải để lộ ảnh */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/70 to-brand-900/10" />
        {/* Dải tối phía trên để chữ trắng của thanh điều hướng trong suốt luôn đọc được kể cả khi ảnh sáng */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-900/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/20 to-transparent" />
        <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-accent-500/20 blur-[100px]" />

        {/* Nội dung */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-start px-6 pb-56 pt-24 sm:px-8 sm:pb-48 lg:justify-center lg:pb-40 lg:pt-[136px]">
          {/* Ảnh trọn vẹn (< lg): khung ngang của điện thoại/máy tính bảng dọc hẹp hơn ảnh rất nhiều —
              phủ kín thì chỉ còn thấy ~15% bề ngang ảnh. Ở đây ảnh thu vừa khung 16:9, KHÔNG cắt; ảnh khác
              tỉ lệ thì phần thừa để lộ nền mờ của chính ảnh đó. Admin chỉ cần tải 1 ảnh. */}
          <div className="hero-rise relative mb-8 aspect-video overflow-hidden rounded-2xl shadow-lg2 ring-1 ring-white/15 lg:hidden">
            {slides.map((slide, i) => (
              <Image
                key={slide.id}
                src={slide.imageUrl}
                alt={slide.caption || `Ảnh banner ${i + 1}`}
                aria-hidden={i !== index}
                fill
                priority={i === 0}
                sizes="100vw"
                className={cn("object-contain transition-opacity duration-[1400ms] ease-in-out", i === index ? "opacity-100" : "opacity-0")}
              />
            ))}
          </div>
          <div className="hero-rise max-w-[720px]">
            <Eyebrow tone="onDark">{badge}</Eyebrow>
            {/* Tiêu đề hiện dần TỪNG TỪ (trượt lên + rõ dần) — `aria-label` giữ nguyên câu cho trình đọc màn hình. */}
            <h1
              aria-label={`${titleLine1} ${titleLine2}`}
              className="mt-6 text-balance font-display text-[42px] font-bold leading-[1.04] tracking-tight sm:text-[60px] lg:text-[74px]"
            >
              {/* Dấu cách đặt NGOÀI span inline-block — để bên trong thì cuối dòng bị nuốt, các từ dính nhau khi xuống dòng. */}
              <span aria-hidden="true">
                {splitWords(titleLine1).map((w, i) => (
                  <Fragment key={`a${i}`}>
                    <span className="hero-word" style={{ animationDelay: `${150 + i * 70}ms` }}>
                      {w}
                    </span>{" "}
                  </Fragment>
                ))}
              </span>
              <em aria-hidden="true" className="block pb-1 font-medium italic">
                {splitWords(titleLine2).map((w, i) => (
                  <Fragment key={`b${i}`}>
                    <span
                      className="hero-word bg-gradient-to-r from-accent-500 to-accent-400 bg-clip-text pr-[0.06em] text-transparent"
                      style={{ animationDelay: `${150 + (splitWords(titleLine1).length + i) * 70}ms` }}
                    >
                      {w}
                    </span>{" "}
                  </Fragment>
                ))}
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
                // key theo banner → mỗi lần đổi ảnh, chú thích trượt lên lại (CSS .hero-caption)
                <div key={index} className="hero-caption mt-1.5 flex max-w-[460px] flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-white/85">
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
