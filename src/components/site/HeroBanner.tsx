"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CountUp } from "@/components/site/CountUp";
import { Reveal } from "@/components/site/Reveal";
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
 * Banner chính Trang chủ — "bộ mặt" của website (đổi 19/10/2026 theo yêu cầu người dùng: ảnh phải RÕ
 * và TRỌN, không bị lớp phủ tối + chữ đè làm mờ):
 * - **Ảnh sạch**: khung đúng tỉ lệ 16:9 (máy tính: tối đa cao bằng màn hình) nên ảnh 16:9 hiện trọn,
 *   không phủ màu, không chữ đè, không Ken Burns. Chỉ máy tính có dải mờ nhẹ ở mép trên cho chữ trắng
 *   của thanh menu trong suốt đọc được. Banner có link → bấm vào ảnh là đi tới link đó.
 * - **Chữ xuống dưới ảnh**: nhãn + tiêu đề + mô tả + 2 nút + 2 số liệu (Nội dung Trang chủ) nằm trên
 *   dải nền sáng ngay dưới ảnh.
 * - Nhiều banner: crossfade, thanh tiến trình, ‹ ›, tạm dừng (WCAG 2.2.2), vuốt trên điện thoại. Nút
 *   điều khiển: ≥ sm là viên thuốc nhỏ góc dưới ảnh; điện thoại nằm thành hàng ngay dưới ảnh để không che ảnh.
 * `prefers-reduced-motion` → không tự chuyển. Banner đang ẩn có `inert` + `aria-hidden`.
 */
export function HeroBanner({ slides, badge, titleLine1, titleLine2, description, stats }: HeroBannerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);
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

  // Vuốt ngang trên màn hình cảm ứng để đổi banner (> 40px mới tính, tránh nhầm với cuộn dọc).
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (count < 2 || start == null || end == null || Math.abs(end - start) < 40) return;
    go(end < start ? index + 1 : index - 1);
  };

  const progressBars = (light: boolean) => (
    <div className="flex items-center gap-1.5">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          type="button"
          onClick={() => go(i)}
          aria-label={`Banner ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          className="group relative h-8 w-8 sm:w-10"
        >
          <span
            className={cn(
              "absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full",
              light ? "bg-white/30 group-hover:bg-white/50" : "bg-brand-900/15 group-hover:bg-brand-900/25"
            )}
          >
            {i === index && (
              <span
                key={`${index}-${autoplay}`}
                className={cn("absolute inset-y-0 left-0 rounded-full", light ? "bg-white" : "bg-accent-600", autoplay ? "hero-progress" : "w-full")}
                style={autoplay ? { animationDuration: `${INTERVAL_MS}ms` } : undefined}
              />
            )}
            {i < index && <span className={cn("absolute inset-0 rounded-full", light ? "bg-white/70" : "bg-brand-900/35")} />}
          </span>
        </button>
      ))}
    </div>
  );

  const controlButtons = (light: boolean) => {
    const btn = cn(
      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
      light ? "text-white hover:bg-white/15" : "border border-line bg-white text-brand-900 hover:border-brand-500"
    );
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"}
          aria-pressed={paused}
          className={btn}
        >
          {paused ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
          )}
        </button>
        <button type="button" onClick={() => go(index - 1)} aria-label="Banner trước" className={btn}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" onClick={() => go(index + 1)} aria-label="Banner tiếp theo" className={btn}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    );
  };

  const counter = (light: boolean) => (
    <span className={cn("font-mono text-[11px] tracking-[0.2em]", light ? "text-white/70" : "text-ink-faint")}>
      <span className={light ? "text-white" : "text-brand-900"}>{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
    </span>
  );

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Banner giới thiệu nhà trường"
        // -mt-[72px]: kéo lên dưới thanh menu trong suốt (SiteHeader cao 72px). Điện thoại: ảnh bắt đầu
        // NGAY DƯỚI menu (nền xanh đậm sau menu) vì ảnh 16:9 thấp, để menu đè thì mất 1/3 ảnh. Máy tính:
        // ảnh nằm dưới menu, chỉ phủ mờ nhẹ mép trên. Margin âm đặt trên CHÍNH section (xem CLAUDE.md);
        // khoảng chừa cho menu ở điện thoại phải là PADDING — margin của khung ảnh sẽ gộp (collapse) với
        // margin âm này thành 0 và section tụt xuống dưới menu, menu chữ trắng nằm trên nền trắng.
        className="relative isolate -mt-[72px] bg-brand-900 pt-[72px] lg:pt-0"
      >
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative aspect-video w-full overflow-hidden lg:aspect-auto lg:h-[min(calc(100svh-33px),56.25vw)]"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              inert={i !== index}
              aria-hidden={i !== index}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out",
                i === index ? "opacity-100" : "opacity-0"
              )}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.caption || `Ảnh banner ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              {slide.linkUrl && (
                <Link
                  href={slide.linkUrl}
                  aria-label={slide.caption ? `${slide.caption} — xem chi tiết` : "Xem chi tiết banner"}
                  className="absolute inset-0"
                />
              )}
            </div>
          ))}

          {/* Chỉ máy tính: dải mờ nhẹ mép trên cho chữ trắng của thanh menu trong suốt — không phủ phần còn lại. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 bg-gradient-to-b from-brand-900/55 to-transparent lg:block" />

          {/* ≥ sm: chú thích + điều khiển gọn ở góc dưới ảnh */}
          {(count > 1 || current?.caption) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden sm:block lg:bottom-8">
              <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-8">
                <div className="min-w-0 flex-1" aria-live="polite">
                  {current?.caption && (
                    <div
                      key={index}
                      className="hero-caption pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-full bg-brand-900/60 px-4 py-2 text-[13px] text-white backdrop-blur-md lg:max-w-[520px]"
                    >
                      <span className="min-w-0 truncate">{current.caption}</span>
                      {current.linkUrl && (
                        <Link href={current.linkUrl} className="shrink-0 font-semibold underline-offset-4 hover:underline">
                          Xem chi tiết →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                {count > 1 && (
                  <div className="pointer-events-auto flex shrink-0 items-center gap-3 rounded-full bg-brand-900/60 py-1 pl-4 pr-1 backdrop-blur-md">
                    {counter(true)}
                    {progressBars(true)}
                    {controlButtons(true)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Điện thoại (< sm): chú thích + điều khiển thành hàng ngay dưới ảnh — không đè lên ảnh nhỏ. */}
      {(count > 1 || current?.caption) && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 sm:hidden">
          <div className="min-w-0 text-[12.5px] text-ink-soft" aria-live="polite">
            {count > 1 && counter(false)}
            {current?.caption && (
              <div className="truncate">
                {current.linkUrl ? (
                  <Link href={current.linkUrl} className="font-semibold text-brand-700">
                    {current.caption} →
                  </Link>
                ) : (
                  current.caption
                )}
              </div>
            )}
          </div>
          {count > 1 && controlButtons(false)}
        </div>
      )}

      {/* Dải chữ dưới ảnh: nhãn, tiêu đề, mô tả (trái) — nút + số liệu (phải). */}
      <div className="px-6 pb-24 pt-10 sm:px-8 lg:pb-28 lg:pt-14">
        <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <Reveal className="max-w-[780px]">
            <Eyebrow tone="red">{badge}</Eyebrow>
            <h1 className="mt-5 text-balance font-display text-[32px] font-bold leading-[1.1] tracking-tight text-brand-900 sm:text-[44px] lg:text-[54px]">
              {titleLine1}{" "}
              <em className="font-medium italic text-accent-600">{titleLine2}</em>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft sm:text-[16.5px]">{description}</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-7 lg:items-end">
            <div className="flex flex-wrap gap-3">
              <Button href="/tuyen-sinh">Đăng ký xét tuyển</Button>
              <Button href="/nganh-dao-tao" variant="outline">
                Khám phá ngành học →
              </Button>
            </div>
            {stats.length > 0 && (
              <dl className="flex gap-8">
                {stats.map((s, i) => (
                  <div key={s.label} className={cn(i > 0 && "border-l border-line pl-8")}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-mono text-[28px] font-semibold leading-none text-brand-900 sm:text-[30px]">
                      <CountUp value={s.value} />
                    </dd>
                    <dd className="mt-1.5 text-[12.5px] text-ink-faint">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>
        </div>
      </div>
    </>
  );
}
