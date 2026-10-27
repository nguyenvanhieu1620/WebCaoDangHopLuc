"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FacultyCard } from "@/components/site/FacultyCard";
import {
  EMPTY_FILTERS,
  filterMembers,
  type DirectoryFilters,
  type DirectoryMember,
  type DirectoryOption,
} from "@/lib/faculty-directory";
import { cn } from "@/lib/utils";

/** Tên tham số trên URL cho từng tiêu chí — link chia sẻ / nút Quay lại giữ đúng bộ lọc. */
const PARAM: Record<keyof DirectoryFilters, string> = {
  q: "q",
  khoa: "khoa",
  trinhDo: "trinh-do",
  hocHam: "hoc-ham",
  chucVu: "chuc-vu",
};

type Props = {
  members: DirectoryMember[];
  departmentOptions: DirectoryOption[];
  degreeOptions: DirectoryOption[];
  rankOptions: DirectoryOption[];
  roleOptions: DirectoryOption[];
  initial: DirectoryFilters;
};

/**
 * Danh bạ giảng viên tìm theo nhiều tiêu chí: từ khoá (tên, chuyên môn, chức vụ… — không dấu), Khoa/Bộ
 * môn (nút bấm kèm số lượng theo các bộ lọc còn lại), Trình độ (gom bậc: Tiến sĩ, CKII, Thạc sĩ…),
 * Chức vụ, Học hàm (chỉ hiện khi có dữ liệu). Lọc ngay trên trình duyệt (vài chục–vài trăm người),
 * ghi bộ lọc lên URL bằng `history.replaceState` (không tải lại trang). Kết quả vẫn nhóm theo khoa.
 */
export function FacultyDirectory({ members, departmentOptions, degreeOptions, rankOptions, roleOptions, initial }: Props) {
  const [filters, setFilters] = useState<DirectoryFilters>(initial);
  const set = (key: keyof DirectoryFilters, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const url = new URL(window.location.href);
    (Object.keys(PARAM) as (keyof DirectoryFilters)[]).forEach((k) => {
      const v = filters[k].trim();
      if (v) url.searchParams.set(PARAM[k], v);
      else url.searchParams.delete(PARAM[k]);
    });
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [filters]);

  const results = useMemo(() => filterMembers(members, filters), [members, filters]);
  const deptCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of filterMembers(members, filters, "khoa")) map.set(m.departmentKey, (map.get(m.departmentKey) ?? 0) + 1);
    return map;
  }, [members, filters]);
  const totalForChips = useMemo(() => [...deptCounts.values()].reduce((a, b) => a + b, 0), [deptCounts]);

  const groups = departmentOptions
    .map((d) => ({ dept: d, list: results.filter((m) => m.departmentKey === d.key) }))
    .filter((g) => g.list.length > 0);

  const active = (Object.keys(filters) as (keyof DirectoryFilters)[]).filter((k) => filters[k].trim());
  const labelOf = (k: keyof DirectoryFilters): string => {
    const v = filters[k];
    const find = (opts: DirectoryOption[]) => opts.find((o) => o.key === v)?.label ?? v;
    if (k === "q") return `“${v.trim()}”`;
    if (k === "khoa") return find(departmentOptions);
    if (k === "trinhDo") return find(degreeOptions);
    if (k === "hocHam") return find(rankOptions);
    return find(roleOptions);
  };

  // Không ghép 2 class cùng thuộc tính (VD pl-4 + pl-11): `cn()` chỉ nối chuỗi, class nào thắng phụ thuộc thứ tự CSS sinh ra.
  const fieldBase =
    "w-full appearance-none rounded-xl border py-3 text-[14px] outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100";

  return (
    <div>
      {/* Thanh tìm kiếm + bộ lọc */}
      <div className="rounded-[22px] border border-line bg-white p-4 shadow-sm2 sm:p-6">
        <div
          className={cn(
            // Điện thoại xếp dọc: 2 ô chọn đặt cạnh nhau chỉ rộng ~140px, chữ 16px (chống iOS phóng to) bị cắt.
            "grid gap-3 sm:grid-cols-2",
            rankOptions.length > 0 ? "lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]" : "lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]"
          )}
        >
          <div className="relative sm:col-span-2 lg:col-span-1">
            <label htmlFor="faculty-q" className="sr-only">
              Tìm giảng viên
            </label>
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              id="faculty-q"
              name="q"
              type="search"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Tên, chuyên môn, chức vụ…"
              autoComplete="off"
              className={cn(fieldBase, "pl-11 pr-4", filters.q ? "border-brand-500 bg-white text-ink" : "border-line bg-paper text-ink")}
            />
          </div>
          <FilterSelect id="faculty-trinh-do" label="Trình độ" value={filters.trinhDo} onChange={(v) => set("trinhDo", v)} options={degreeOptions} allLabel="Mọi trình độ" fieldBase={fieldBase} />
          <FilterSelect id="faculty-chuc-vu" label="Chức vụ" value={filters.chucVu} onChange={(v) => set("chucVu", v)} options={roleOptions} allLabel="Mọi chức vụ" fieldBase={fieldBase} />
          {rankOptions.length > 0 && (
            <FilterSelect id="faculty-hoc-ham" label="Học hàm" value={filters.hocHam} onChange={(v) => set("hocHam", v)} options={rankOptions} allLabel="Mọi học hàm" fieldBase={fieldBase} />
          )}
        </div>

        {departmentOptions.length > 1 && (
          <div className="mt-4 border-t border-line pt-4">
            <div id="faculty-khoa-label" className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Khoa / Bộ môn
            </div>
            <div role="group" aria-labelledby="faculty-khoa-label" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
              <Chip pressed={!filters.khoa} onClick={() => set("khoa", "")} count={totalForChips}>
                Tất cả
              </Chip>
              {departmentOptions.map((d) => (
                <Chip key={d.key} pressed={filters.khoa === d.key} onClick={() => set("khoa", filters.khoa === d.key ? "" : d.key)} count={deptCounts.get(d.key) ?? 0}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Số kết quả + bộ lọc đang áp dụng */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-[14px] text-ink-soft" aria-live="polite">
          {active.length ? "Tìm thấy " : "Tất cả "}
          <strong className="text-brand-900">{results.length}</strong> giảng viên
        </p>
        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {active.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => set(k, "")}
                aria-label={`Bỏ lọc ${labelOf(k)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-semibold text-brand-800 transition-colors hover:bg-brand-100"
              >
                {labelOf(k)}
                <span aria-hidden="true" className="text-[14px] leading-none">×</span>
              </button>
            ))}
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-[12.5px] font-semibold text-accent-600 hover:underline">
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Kết quả — vẫn nhóm theo khoa */}
      {results.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-line bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5M8.5 11h5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-4 font-display text-[18px] font-semibold text-brand-900">Không tìm thấy giảng viên phù hợp</p>
          <p className="mt-1.5 text-[14px] text-ink-soft">Thử bớt điều kiện lọc hoặc tìm bằng từ khoá ngắn hơn.</p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="mt-5 rounded-xl border-[1.5px] border-brand-700 px-5 py-2.5 text-[14px] font-bold text-brand-700 transition-colors hover:bg-brand-700 hover:text-white"
          >
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-14">
          {groups.map(({ dept, list }) => (
            <section key={dept.key} aria-labelledby={`khoa-${dept.key}`}>
              {/* Chỉ còn 1 nhóm (đã chọn 1 khoa) thì vẫn giữ tiêu đề để biết đang xem khoa nào. */}
              <div className="mb-6 flex items-center gap-4">
                <span className="h-6 w-1 rounded-full bg-accent-600" />
                <h2 id={`khoa-${dept.key}`} className="font-display text-[22px] font-semibold text-brand-900">
                  {dept.label}
                </h2>
                <span className="font-mono text-[11px] text-ink-faint">{list.length} giảng viên</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {list.map((m, i) => (
                  <FacultyCard
                    key={m.id}
                    delay={(i % 4) * 80}
                    data={{
                      href: m.slug ? `/doi-ngu-giang-vien/${m.slug}` : null,
                      name: m.displayName,
                      role: m.role,
                      specialty: m.specialty,
                      photoUrl: m.photoUrl,
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
  fieldBase,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: DirectoryOption[];
  allLabel: string;
  fieldBase: string;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} name={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldBase, "pl-4 pr-10", value ? "border-brand-500 bg-white font-semibold text-brand-800" : "border-line bg-paper text-ink")}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Chip({ pressed, onClick, count, children }: { pressed: boolean; onClick: () => void; count: number; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      disabled={!pressed && count === 0}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        pressed ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-soft enabled:hover:border-brand-500 enabled:hover:text-brand-700"
      )}
    >
      {children}
      <span className={cn("rounded-full px-1.5 py-px font-mono text-[11px]", pressed ? "bg-white/20 text-white" : "bg-paper-alt text-ink-faint")}>{count}</span>
    </button>
  );
}
