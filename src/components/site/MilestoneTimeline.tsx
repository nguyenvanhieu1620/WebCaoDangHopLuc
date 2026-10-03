"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MilestoneYear } from "@/lib/data/milestones";

/**
 * Dòng thời gian "Những cột mốc" kiểu VinUni: thanh năm nằm ngang (cuộn được
 * khi nhiều năm), chọn 1 năm → hiện các mốc trong năm đó. Mặc định chọn năm
 * MỚI NHẤT. Bàn phím: ← → chuyển năm (mẫu tablist chuẩn WAI-ARIA).
 */
export function MilestoneTimeline({ years }: { years: MilestoneYear[] }) {
  const [active, setActive] = useState(years.length - 1);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const current = years[active];

  // Giữ năm đang chọn nằm trong khung nhìn của thanh năm (khi nhiều năm phải cuộn ngang).
  useEffect(() => {
    const tab = tabRefs.current[active];
    const rail = railRef.current;
    if (!tab || !rail) return;
    const left = tab.offsetLeft - rail.clientWidth / 2 + tab.offsetWidth / 2;
    rail.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);

  if (!current) return null;

  function select(i: number, focus = false) {
    const next = (i + years.length) % years.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") select(active + 1, true);
    else if (e.key === "ArrowLeft") select(active - 1, true);
    else if (e.key === "Home") select(0, true);
    else if (e.key === "End") select(years.length - 1, true);
    else return;
    e.preventDefault();
  }

  const arrow = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent-600 text-accent-600 transition-colors enabled:hover:bg-accent-600 enabled:hover:text-white disabled:opacity-30";

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Năm trước" onClick={() => select(active - 1)} disabled={active === 0} className={arrow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div ref={railRef} className="no-scrollbar relative flex-1 overflow-x-auto">
          <div role="tablist" aria-label="Chọn năm" onKeyDown={onKeyDown} className="relative flex min-w-full justify-between gap-2 px-2">
            {/* Đường nối các năm */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-[30px] h-0.5 bg-brand-900/10" />
            {years.map((y, i) => (
              <button
                key={y.year}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`milestone-tab-${y.year}`}
                aria-selected={i === active}
                aria-controls="milestone-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                className="group relative flex min-w-[88px] flex-col items-center gap-3 pb-1 pt-[22px]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 h-4 w-4 rounded-full border-[3px] transition-all duration-300",
                    i === active ? "scale-125 border-accent-600 bg-white shadow-[0_0_0_6px_rgba(196,30,36,0.15)]" : "border-brand-900/25 bg-paper group-hover:border-brand-700"
                  )}
                />
                <span
                  className={cn(
                    "font-display font-bold transition-all duration-300",
                    i === active ? "text-[30px] text-brand-900" : "text-[20px] text-ink-faint group-hover:text-brand-700"
                  )}
                >
                  {y.year}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button type="button" aria-label="Năm sau" onClick={() => select(active + 1)} disabled={active === years.length - 1} className={arrow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {/* key theo năm → đổi năm thì các mốc hiện lại so le (CSS .milestone-panel) */}
      <div
        key={current.year}
        id="milestone-panel"
        role="tabpanel"
        aria-labelledby={`milestone-tab-${current.year}`}
        className="milestone-panel mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {current.items.map((m, i) => (
          <article
            key={m.id}
            style={{ animationDelay: `${i * 90}ms` }}
            className="group overflow-clip rounded-[22px] border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2"
          >
            {m.imageUrl && (
              <div className="img-shine relative h-[180px]">
                <Image src={m.imageUrl} alt={m.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            )}
            <div className="relative p-6">
              <span aria-hidden="true" className="absolute left-0 top-7 h-6 w-1 rounded-r bg-accent-600" />
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-600">
                {m.period ? `${m.period} · ${current.year}` : current.year}
              </div>
              <h3 className="mt-2 font-display text-[19px] font-semibold leading-snug text-brand-900">{m.title}</h3>
              {m.description && <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{m.description}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
