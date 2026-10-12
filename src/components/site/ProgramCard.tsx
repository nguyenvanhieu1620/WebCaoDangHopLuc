"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import type { Program } from "@/lib/db/schema";
import { FitImage } from "@/components/ui/FitImage";

type ProgramCardProps = {
  program: Pick<Program, "slug" | "code" | "name" | "summary" | "duration" | "intake"> & { imageUrl?: string | null };
  gradientClass: string;
  delay?: number;
};

/**
 * Thẻ ngành đào tạo dùng chung cho Trang chủ + `/nganh-dao-tao` — gộp lại
 * từ 2 chỗ markup gần giống hệt nhau, đồng thời thêm hiệu ứng "spotlight"
 * theo con trỏ chuột (`--spot-x`/`--spot-y` cập nhật qua `onMouseMove`, chỉ
 * CSS thuần vẽ vệt sáng tròn, không thêm thư viện ngoài). Client Component
 * vì cần `onMouseMove` — không gắn được từ Server Component.
 * Ngành có ảnh (admin/nganh-dao-tao) thì đầu thẻ là ảnh thật, thân thẻ vẫn là
 * khối màu gradient xoay vòng; chưa có ảnh thì chỉ có khối màu như cũ.
 */
export function ProgramCard({ program: p, gradientClass, delay = 0 }: ProgramCardProps) {
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
          "program-card-depth group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-gradient-to-br p-7 text-white shadow-md2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700",
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
        {p.imageUrl ? (
          // Có ảnh: ảnh tràn sát mép trên thẻ (bù -mx/-mt đúng bằng p-7), mã ngành + thời gian thành nhãn kính đè lên ảnh.
          <div className="img-shine relative -mx-7 -mt-7 mb-5 h-[168px] shrink-0">
            <FitImage
              src={p.imageUrl}
              alt={p.name}
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 46vw, 400px"
              className="transition-transform duration-700 group-hover:scale-105"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/55 via-transparent to-brand-900/20" />
            <div className="absolute inset-x-4 top-4 z-[4] flex items-center justify-between font-mono text-[10.5px] font-semibold uppercase tracking-wider">
              <span className="rounded-full bg-white/20 px-2.5 py-1 ring-1 ring-inset ring-white/30 backdrop-blur-md">{p.code}</span>
              <span className="rounded-full bg-white/20 px-2.5 py-1 ring-1 ring-inset ring-white/30 backdrop-blur-md">{p.duration}</span>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between font-mono text-[10.5px] uppercase tracking-wider text-white/85">
            <span>{p.code}</span>
            <span>{p.duration}</span>
          </div>
        )}
        <h3 className={cn("relative font-display text-[22px] font-bold", !p.imageUrl && "mt-3.5")}>{p.name}</h3>
        <p className="relative mt-2.5 max-w-[220px] text-[13px] leading-relaxed text-white/90">
          {p.summary}
        </p>
        {/* mt-auto: thẻ cao (slider Trang chủ) thì dòng cuối luôn nằm sát đáy, thẳng hàng giữa các thẻ */}
        <div className="relative mt-auto flex items-center justify-between pt-5">
          <span className="text-[12px] font-semibold text-white/80">Chỉ tiêu {p.intake}</span>
          <span className="text-[13px] font-bold">
            {/* gạch chân trắng trên nền màu (inline style vì CSS .link-underline đứng sau lớp utilities, class arbitrary không đè được) */}
            <span className="link-underline" style={{ backgroundImage: "linear-gradient(white, white)" }}>Chi tiết</span> →
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
