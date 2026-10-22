"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { flushSync } from "react-dom";
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
  /** Video nền MP4/WEBM (tuỳ chọn) — chỉ phát trên máy tính; ảnh vẫn là ảnh chờ + ảnh điện thoại. */
  videoUrl?: string | null;
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
/** Banner có video: hiện lâu hơn để video kịp chạy hết 1 vòng ngắn (khuyến nghị 5–15 giây). */
const VIDEO_INTERVAL_MS = 12000;
/** Thời gian ảnh trượt nốt vào chỗ (hoặc trượt về) sau khi thả chuột/ngón tay. */
const SETTLE_MS = 450;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  width: number;
  dx: number;
  /** Đã kéo ngang đủ xa để tính là kéo (chưa thì vẫn là 1 cú bấm bình thường). */
  active: boolean;
  /** Banner đang trượt vào từ cạnh (kéo sang trái → banner sau, sang phải → banner trước). */
  neighbor: number | null;
};

/**
 * Video nền trong khung ảnh banner — CHỈ tạo trên máy tính (≥ lg) và khi không bật giảm chuyển động, nên
 * điện thoại không tải video. Tắt tiếng + lặp + `playsInline` (trình duyệt cho tự chạy). Ẩn (opacity 0) tới
 * khi thật sự chạy → trước đó người xem thấy ảnh banner bên dưới, không chớp đen. `play` = banner đang hiện
 * và chưa bấm tạm dừng (WCAG 2.2.2: nút tạm dừng phải dừng được video).
 */
function HeroVideo({ src, play, enabled }: { src: string; play: boolean; enabled: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [desktop, setDesktop] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    const frame = requestAnimationFrame(update);
    mq.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) v.play().catch(() => {});
    else v.pause();
  }, [play, desktop, enabled]);

  if (!desktop || !enabled) return null;
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload={play ? "auto" : "metadata"}
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setReady(true)}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
        ready ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

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
  const [dragging, setDragging] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<DragState | null>(null);
  const [settling, setSettling] = useState(false);
  const suppressClick = useRef(false);
  const count = slides.length;
  const current = slides[index] ?? slides[0];
  const hasVideo = slides.some((s) => s.videoUrl);
  const intervalMs = current?.videoUrl ? VIDEO_INTERVAL_MS : INTERVAL_MS;

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
    if (count < 2 || paused || reducedMotion || dragging) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearTimeout(id);
  }, [index, count, paused, reducedMotion, dragging, intervalMs]);

  const go = (next: number) => {
    if (settling) return;
    setIndex((next + count) % count);
  };
  const autoplay = count > 1 && !paused && !reducedMotion && !dragging;

  // ── Kéo bằng chuột / vuốt bằng ngón tay để đổi banner ─────────────────────────────────────────
  // Đặt style trực tiếp lên 2 lớp ảnh (không setState mỗi lần di chuột → không render lại cả banner):
  // ảnh hiện tại chạy theo tay, banner kế bên trượt vào từ cạnh. Thả ra quá ~18% bề rộng (tối đa
  // 120px) → trượt nốt sang banner mới; chưa đủ → trượt về chỗ cũ. Ngoài lúc kéo, đổi banner vẫn là
  // hiệu ứng mờ dần (crossfade) như cũ. Nút ‹ › và thanh tiến trình giữ nguyên cho bàn phím.
  const styleSlide = (i: number | null, style: Partial<CSSStyleDeclaration>) => {
    const el = i == null ? null : slideRefs.current[i];
    if (el) Object.assign(el.style, style);
  };
  const clearSlide = (i: number | null) => styleSlide(i, { transform: "", opacity: "", transition: "" });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (count < 2 || settling || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as Element).closest("button")) return; // nút điều khiển đè trên ảnh
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      width: e.currentTarget.clientWidth,
      dx: 0,
      active: false,
      neighbor: null,
    };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      // Di theo chiều dọc trước → không phải kéo banner (trên điện thoại là cuộn trang).
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) drag.current = null;
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    d.dx = dx;
    if (reducedMotion) return;
    const neighbor = (index + (dx < 0 ? 1 : -1) + count) % count;
    if (d.neighbor !== null && d.neighbor !== neighbor) clearSlide(d.neighbor);
    d.neighbor = neighbor;
    styleSlide(index, { transition: "none", transform: `translateX(${dx}px)` });
    styleSlide(neighbor, {
      transition: "none",
      opacity: "1",
      transform: `translateX(${dx + (dx < 0 ? d.width : -d.width)}px)`,
    });
  };

  const settle = (d: DragState, commit: boolean, dir: 1 | -1) => {
    const cur = index;
    const neighbor = d.neighbor!;
    const ease = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    setSettling(true);
    styleSlide(cur, { transition: ease, transform: `translateX(${commit ? -dir * d.width : 0}px)` });
    styleSlide(neighbor, { transition: ease, transform: `translateX(${commit ? 0 : dir * d.width}px)` });
    window.setTimeout(() => {
      // Lớp vừa trượt ra ngoài: ẩn ngay (không chạy hiệu ứng mờ 1,2s), rồi mới trả về giữa khung.
      const hidden = commit ? cur : neighbor;
      styleSlide(hidden, { transition: "none", opacity: "0" });
      if (commit) flushSync(() => setIndex(neighbor));
      styleSlide(hidden, { transform: "" });
      void slideRefs.current[hidden]?.offsetWidth;
      clearSlide(hidden);
      clearSlide(commit ? neighbor : cur);
      setSettling(false);
    }, SETTLE_MS);
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    if (!d.active) return;
    setDragging(false);
    // Vừa kéo xong thì cú "click" đi kèm không được mở link của banner.
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
    const commit = e.type === "pointerup" && Math.abs(d.dx) > Math.min(120, d.width * 0.18);
    const dir = d.dx < 0 ? 1 : -1;
    if (reducedMotion || d.neighbor === null) {
      if (commit) go(index + dir);
      return;
    }
    settle(d, commit, dir);
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick.current = false;
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
                style={autoplay ? { animationDuration: `${intervalMs}ms` } : undefined}
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
          aria-label={
            count > 1 ? (paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu") : paused ? "Phát tiếp video" : "Tạm dừng video"
          }
          aria-pressed={paused}
          className={btn}
        >
          {paused ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
          )}
        </button>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} aria-label="Banner trước" className={btn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Banner tiếp theo" className={btn}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
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
        // -mt-[72px] lg:-mt-[84px]: kéo lên dưới thanh menu trong suốt (SiteHeader cao 72px, máy tính 84px). Điện thoại: ảnh bắt đầu
        // NGAY DƯỚI menu (nền xanh đậm sau menu) vì ảnh 16:9 thấp, để menu đè thì mất 1/3 ảnh. Máy tính:
        // ảnh nằm dưới menu, chỉ phủ mờ nhẹ mép trên. Margin âm đặt trên CHÍNH section (xem CLAUDE.md);
        // khoảng chừa cho menu ở điện thoại phải là PADDING — margin của khung ảnh sẽ gộp (collapse) với
        // margin âm này thành 0 và section tụt xuống dưới menu, menu chữ trắng nằm trên nền trắng.
        className="relative isolate -mt-[72px] bg-brand-900 pt-[72px] lg:-mt-[84px] lg:pt-0"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onClickCapture={onClickCapture}
          // Chặn kéo ảnh/link kiểu "kéo-thả file" mặc định của trình duyệt (ra ảnh mờ dính theo chuột).
          onDragStart={(e) => e.preventDefault()}
          className={cn(
            // touch-pan-y: trên cảm ứng, vuốt dọc vẫn cuộn trang, vuốt ngang để đổi banner.
            "relative aspect-video w-full touch-pan-y touch-pinch-zoom select-none overflow-hidden lg:aspect-auto lg:h-[min(calc(100svh-120px),50vw)]",
            count > 1 && (dragging ? "cursor-grabbing" : "cursor-grab")
          )}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
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
              {slide.videoUrl && <HeroVideo src={slide.videoUrl} play={i === index && !paused} enabled={!reducedMotion} />}
              {slide.linkUrl && (
                <Link
                  href={slide.linkUrl}
                  aria-label={slide.caption ? `${slide.caption} — xem chi tiết` : "Xem chi tiết banner"}
                  draggable={false}
                  className={cn("absolute inset-0", dragging && "cursor-grabbing")}
                />
              )}
            </div>
          ))}

          {/* Chỉ máy tính: dải mờ nhẹ mép trên cho chữ trắng của thanh menu trong suốt — không phủ phần còn lại. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 bg-gradient-to-b from-brand-900/55 to-transparent lg:block" />

          {/* ≥ sm: chú thích + điều khiển gọn ở góc dưới ảnh */}
          {(count > 1 || current?.caption || hasVideo) && (
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
                {/* Nhiều banner: đủ bộ điều khiển. 1 banner có video: chỉ nút tạm dừng, chỉ máy tính (nơi video phát). */}
                {(count > 1 || hasVideo) && (
                  <div
                    className={cn(
                      "pointer-events-auto shrink-0 items-center gap-3 rounded-full bg-brand-900/60 py-1 pr-1 backdrop-blur-md",
                      count > 1 ? "flex pl-4" : "hidden pl-1 lg:flex"
                    )}
                  >
                    {count > 1 && counter(true)}
                    {count > 1 && progressBars(true)}
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
              {titleLine1} {titleLine2}
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
