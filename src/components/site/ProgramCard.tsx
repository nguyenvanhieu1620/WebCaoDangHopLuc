"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import type { Program } from "@/lib/db/schema";
import { FitImage } from "@/components/ui/FitImage";
import type { Locale } from "@/lib/locale";
import { siteCopy, programDuration } from "@/lib/site-copy";

type ProgramCardProps = {
  locale?: Locale;
  program: Pick<Program, "slug" | "code" | "name" | "summary" | "duration" | "intake"> & { imageUrl?: string | null };
  gradientClass: string;
  delay?: number;
};

/**
 * Thẻ ngành đào tạo trong slider Trang chủ, có hiệu ứng "spotlight"
 * theo con trỏ chuột (`--spot-x`/`--spot-y` cập nhật qua `onPointerMove`, chỉ
 * CSS thuần vẽ vệt sáng tròn, không thêm thư viện ngoài). Client Component
 * vì cần `onPointerMove` — không gắn được từ Server Component.
 * Ngành có ảnh (admin/nganh-dao-tao) thì đầu thẻ là ảnh thật, thân thẻ vẫn là
 * khối màu gradient xoay vòng; chưa có ảnh thì dùng mã ngành trên nền trang trí.
 */
export function ProgramCard({ program: p, gradientClass, delay = 0, locale = "vi" }: ProgramCardProps) {
  const t = siteCopy(locale);
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={`/nganh-dao-tao/${p.slug}`}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
          const x = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5));
          const y = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5));
          e.currentTarget.style.setProperty("--tilt-x", `${-y * 8}deg`);
          e.currentTarget.style.setProperty("--tilt-y", `${x * 8}deg`);
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty("--tilt-x", "0deg");
          e.currentTarget.style.setProperty("--tilt-y", "0deg");
        }}
        className={cn(
          "program-card-depth group relative flex h-full flex-col overflow-hidden rounded-[24px] bg-gradient-to-br text-white shadow-md2 ring-1 ring-inset ring-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700",
          gradientClass
        )}
        // Kéo slider bằng chuột không được kéo theo "bóng ma" của link.
        draggable={false}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.25), transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-[150px] w-[150px] rounded-full bg-white/10" />
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden border-b border-white/15">
          {p.imageUrl ? (
            <FitImage
              src={p.imageUrl}
              alt={p.name}
              sizes="(max-width: 639px) 85vw, (max-width: 1023px) 46vw, 420px"
              className="transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-visible:scale-[1.035] motion-reduce:transition-none"
              draggable={false}
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-white/5">
              <span className="select-none font-display text-[72px] font-semibold tracking-tight text-white/20">{p.code}</span>
              <span className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-white/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/55 via-transparent to-brand-900/20" />
          <div className="absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-wider">
            <span className="max-w-full break-words rounded-full bg-brand-900/70 px-3 py-1.5 ring-1 ring-inset ring-white/25 backdrop-blur-sm">{p.code}</span>
            <span className="max-w-full break-words rounded-full bg-brand-900/70 px-3 py-1.5 ring-1 ring-inset ring-white/25 backdrop-blur-sm">{programDuration(p.duration, locale)}</span>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="min-h-[2.6em] text-pretty font-display text-[22px] font-semibold leading-[1.3] tracking-tight sm:text-[24px]">{p.name}</h3>
          <p className="mt-3 line-clamp-3 min-h-[4.95em] text-[14px] leading-[1.65] text-white/85">
            {p.summary}
          </p>
          {/* Chân thẻ thẳng hàng trong slider kể cả khi tên ngành xuống hai dòng. */}
          <div className="mt-auto pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-5">
              <span className="text-[11px] font-medium text-white/75">
                {t.intake}
                <span className="mt-1 block font-mono text-[22px] font-semibold leading-none text-white">{p.intake}</span>
              </span>
              <span className="inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-brand-900 shadow-sm2 transition-colors group-hover:bg-brand-50 group-focus-visible:bg-brand-50">
                {t.details}
                <span aria-hidden="true" className="transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1 motion-reduce:transition-none">→</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
