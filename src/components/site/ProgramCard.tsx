"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import type { Program } from "@/lib/db/schema";

type ProgramCardProps = {
  program: Pick<Program, "slug" | "code" | "name" | "summary" | "duration" | "intake">;
  gradientClass: string;
  delay?: number;
};

/**
 * Thẻ ngành đào tạo dùng chung cho Trang chủ + `/nganh-dao-tao` — gộp lại
 * từ 2 chỗ markup gần giống hệt nhau, đồng thời thêm hiệu ứng "spotlight"
 * theo con trỏ chuột (`--spot-x`/`--spot-y` cập nhật qua `onMouseMove`, chỉ
 * CSS thuần vẽ vệt sáng tròn, không thêm thư viện ngoài). Client Component
 * vì cần `onMouseMove` — không gắn được từ Server Component.
 */
export function ProgramCard({ program: p, gradientClass, delay = 0 }: ProgramCardProps) {
  return (
    <Reveal delay={delay}>
      <Link
        href={`/nganh-dao-tao/${p.slug}`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
        }}
        className={cn(
          "group relative block overflow-hidden rounded-[22px] bg-gradient-to-br p-7 text-white shadow-md2 transition-transform hover:-translate-y-1.5",
          gradientClass
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255,255,255,0.25), transparent 70%)",
          }}
        />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-[150px] w-[150px] rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between font-mono text-[10.5px] uppercase tracking-wider text-white/85">
          <span>{p.code}</span>
          <span>{p.duration}</span>
        </div>
        <h3 className="relative mt-3.5 font-display text-[22px] font-bold">{p.name}</h3>
        <p className="relative mt-2.5 max-w-[220px] text-[13px] leading-relaxed text-white/90">
          {p.summary}
        </p>
        <div className="relative mt-5 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-white/80">Chỉ tiêu {p.intake}</span>
          <span className="text-[13px] font-bold">Chi tiết →</span>
        </div>
      </Link>
    </Reveal>
  );
}
