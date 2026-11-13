"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/locale";
import { programGradient } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";

type ProgramOption = { slug: string; code: string; name: string; summary: string; duration: string; intake: number; imageUrl: string | null; tuition: string | null };

const COMPARISON_KEY = "hopluc-program-comparison";
const COMPARISON_LIMIT = 3;
const comparisonRowHeadingClass = "sticky left-0 z-10 border-r border-line bg-paper-alt px-2.5 py-3 text-xs font-semibold text-ink-soft";

const text = {
  vi: { search: "Tìm ngành học", placeholder: "Tên ngành hoặc lĩnh vực bạn quan tâm…", compare: "So sánh", selected: "ngành đã chọn", hint: "Chọn tối đa 3 ngành để so sánh thời gian học, chỉ tiêu và học phí.", clear: "Bỏ chọn tất cả", empty: "Không tìm thấy ngành phù hợp. Hãy thử từ khóa khác.", duration: "Thời gian học", intake: "Chỉ tiêu", details: "Khám phá ngành", apply: "Đăng ký ngành này", count: "ngành phù hợp", comparison: "So sánh ngành đã chọn", viewComparison: "Xem so sánh", remove: "Bỏ chọn" },
  en: { search: "Find your program", placeholder: "Program name or an area of interest…", compare: "Compare", selected: "programs selected", hint: "Select up to 3 programs to compare duration, intake and tuition.", clear: "Clear selection", empty: "No matching programs. Try another search.", duration: "Duration", intake: "Intake", details: "Explore program", apply: "Apply for this program", count: "matching programs", comparison: "Compare selected programs", viewComparison: "View comparison", remove: "Remove" },
};

const tableText = {
  vi: { label: "Bảng đối chiếu ngành", criteria: "Tiêu chí", scroll: "Vuốt ngang trong bảng để xem thêm cột.", tuition: "Học phí", contact: "Liên hệ", apply: "Đăng ký" },
  en: { label: "Program comparison table", criteria: "Criteria", scroll: "Swipe within the table to see more columns.", tuition: "Tuition", contact: "Contact us", apply: "Apply" },
};

function normalize(value: string) {
  return value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

function readComparison(): string[] {
  try {
    const raw = sessionStorage.getItem(COMPARISON_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(stored) ? stored.filter((slug): slug is string => typeof slug === "string") : [];
  } catch {
    return [];
  }
}

function availableSelection(slugs: string[], programs: ProgramOption[]): string[] {
  return [...new Set(slugs)].filter(slug => programs.some(program => program.slug === slug)).slice(0, COMPARISON_LIMIT);
}

export function ProgramExplorer({ programs, locale = "vi" }: { programs: ProgramOption[]; locale?: Locale }) {
  const t = text[locale];
  const table = tableText[locale];
  const [query, setQuery] = useState("");
  const [storedSelection, setStoredSelection] = useState<string[] | null>(null);
  const comparisonRef = useRef<HTMLElement>(null);
  const selected = availableSelection(storedSelection ?? [], programs);
  const matches = programs.filter(p => normalize(`${p.name} ${p.summary}`).includes(normalize(query.trim())));
  const comparison = programs.filter(p => selected.includes(p.slug));
  const comparisonRows = [
    { label: t.duration, value: (program: ProgramOption) => program.duration },
    { label: t.intake, value: (program: ProgramOption) => program.intake },
    { label: table.tuition, value: (program: ProgramOption) => program.tuition || table.contact },
  ];

  useEffect(() => {
    const restored = readComparison();
    const frame = requestAnimationFrame(() => setStoredSelection(current => current ?? restored));
    return () => cancelAnimationFrame(frame);
  }, []);

  function saveSelection(next: string[]) {
    setStoredSelection(next);
    try {
      if (next.length === 0) sessionStorage.removeItem(COMPARISON_KEY);
      else sessionStorage.setItem(COMPARISON_KEY, JSON.stringify(next));
    } catch {
      // Vẫn so sánh được trong trang khi trình duyệt chặn storage.
    }
  }

  function toggle(slug: string) {
    const current = storedSelection === null ? availableSelection(readComparison(), programs) : selected;
    if (current.includes(slug)) saveSelection(current.filter(item => item !== slug));
    else if (current.length < COMPARISON_LIMIT) saveSelection([...current, slug]);
  }

  function showComparison() {
    comparisonRef.current?.focus({ preventScroll: true });
    comparisonRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm2 sm:p-6">
        <label htmlFor="program-search" className="mb-2 block text-sm font-bold text-brand-900">{t.search}</label>
        <input id="program-search" name="q" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.placeholder} className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
          <span aria-live="polite">{matches.length} {t.count} · {selected.length}/{COMPARISON_LIMIT} {t.selected}</span>
          {selected.length > 0 && <button type="button" onClick={() => saveSelection([])} className="font-semibold text-brand-700 underline">{t.clear}</button>}
        </div>
        <p className="mt-2 text-xs text-ink-soft">{t.hint}</p>
      </div>

      {comparison.length > 0 && (
        <section ref={comparisonRef} id="so-sanh-nganh" aria-label={t.comparison} tabIndex={-1} className="scroll-mt-[88px] rounded-2xl border border-brand-100 bg-brand-50 p-3 sm:p-5">
          <h2 className="mb-4 font-display text-xl font-semibold text-brand-900">{t.comparison}</h2>
          <div className="lg:hidden">
            {comparison.length > 1 && (
              <p id="so-sanh-scroll-hint" className="mb-2 text-xs text-ink-soft">{table.scroll}</p>
            )}
            <div
              role="region"
              aria-label={table.label}
              tabIndex={0}
              aria-describedby={comparison.length > 1 ? "so-sanh-scroll-hint" : undefined}
              className="overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-white [scroll-padding-left:82px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm" style={{ minWidth: 82 + 114 * comparison.length }}>
                <caption className="sr-only">{t.comparison}</caption>
                <colgroup>
                  <col className="w-[82px]" />
                  <col span={comparison.length} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className={cn(comparisonRowHeadingClass, "border-b")}>{table.criteria}</th>
                    {comparison.map(program => (
                      <th key={program.slug} scope="col" className="border-b border-line bg-brand-50 px-3 pt-3 align-top text-brand-900 [overflow-wrap:anywhere]">
                        <span className="block">{program.name}</span>
                        <button
                          type="button"
                          aria-label={`${t.remove} ${program.name}`}
                          onClick={() => toggle(program.slug)}
                          className="min-h-11 text-xs font-semibold text-brand-700 underline"
                        >
                          {t.remove}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(row => (
                    <tr key={row.label}>
                      <th scope="row" className={cn(comparisonRowHeadingClass, "border-b")}>{row.label}</th>
                      {comparison.map(program => (
                        <td key={program.slug} className="border-b border-line px-3 py-3 font-semibold text-ink [overflow-wrap:anywhere]">
                          {row.value(program)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className={comparisonRowHeadingClass}>{table.apply}</th>
                    {comparison.map(program => (
                      <td key={program.slug} className="px-3 py-3">
                        <Link
                          href={`/tuyen-sinh?nganh=${encodeURIComponent(program.slug)}#dang-ky`}
                          aria-label={`${table.apply} ${program.name}`}
                          className="flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-2 text-center text-xs font-bold text-white hover:bg-brand-800"
                        >
                          {table.apply}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="hidden gap-4 lg:grid lg:grid-cols-3">
            {comparison.map(p => (
              <div key={p.slug} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-brand-900">{p.name}</h3><button type="button" aria-label={`${t.remove} ${p.name}`} onClick={() => toggle(p.slug)} className="rounded px-2 text-ink-soft hover:bg-paper-alt">×</button></div>
                <dl className="my-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-ink-soft">{t.duration}</dt><dd className="font-semibold">{p.duration}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-ink-soft">{t.intake}</dt><dd className="font-semibold">{p.intake}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-ink-soft">{table.tuition}</dt><dd className="max-w-[65%] text-right font-semibold">{p.tuition || table.contact}</dd></div>
                </dl>
                <p className="mb-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-soft">{p.summary}</p>
                <Link href={`/tuyen-sinh?nganh=${encodeURIComponent(p.slug)}#dang-ky`} className="block rounded-lg bg-brand-700 px-3 py-2.5 text-center text-xs font-bold text-white">{t.apply}</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {comparison.length >= 2 && (
        <div className="pointer-events-none sticky top-20 z-20 flex justify-end lg:hidden">
          <button
            type="button"
            aria-controls="so-sanh-nganh"
            onClick={showComparison}
            className="pointer-events-auto inline-flex min-h-11 items-center rounded-full bg-brand-700 px-4 text-sm font-bold text-white shadow-blue hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            {t.viewComparison} ({comparison.length})
          </button>
        </div>
      )}

      {matches.length === 0 ? <p role="status" className="rounded-2xl border border-line bg-white p-8 text-center text-ink-soft">{t.empty}</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((p, i) => (
            <article key={p.slug} className="group flex flex-col overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2">
              {/* Đầu thẻ: ảnh ngành (admin/nganh-dao-tao) hoặc khối màu gradient xoay vòng khi chưa có ảnh.
                  Màu theo thứ tự gốc của ngành (không theo vị trí sau khi lọc) để màu không đổi khi gõ tìm. */}
              <Link href={`/nganh-dao-tao/${p.slug}`} tabIndex={-1} aria-hidden="true" className={cn("img-reveal img-shine relative block h-[170px] bg-gradient-to-br", programGradient(programs.indexOf(p)))}>
                {p.imageUrl ? (
                  <FitImage src={p.imageUrl} alt="" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <span className="absolute -bottom-8 -right-6 font-display text-[110px] font-bold leading-none text-white/15">{p.code}</span>
                )}
                <span className="absolute left-4 top-4 z-[4] rounded-full bg-white/20 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-white ring-1 ring-inset ring-white/30 backdrop-blur-md">
                  {p.code}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-brand-700">{String(i + 1).padStart(2, "0")} / {p.duration}</span><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink-soft"><input type="checkbox" name="compare" value={p.slug} checked={selected.includes(p.slug)} disabled={!selected.includes(p.slug) && selected.length >= COMPARISON_LIMIT} onChange={() => toggle(p.slug)} aria-label={`${t.compare} ${p.name}`} className="h-4 w-4 accent-brand-700" />{t.compare}</label></div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-brand-900">{p.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{p.summary}</p>
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4 text-sm"><span className="text-ink-soft">{t.intake}: <strong className="text-ink">{p.intake}</strong></span><Link href={`/nganh-dao-tao/${p.slug}`} className="font-semibold text-brand-700 hover:underline">{t.details} →</Link></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
