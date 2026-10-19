import Link from "next/link";
import { pageNumbers, type Pagination } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/**
 * Thanh phân trang cuối mỗi danh sách admin: "Hiển thị 21–40 / 57" + ‹ 1 … 3 4 5 … 9 ›. Giữ nguyên các
 * tham số lọc đang có trên URL (`params`, VD `q`, `status`); trang 1 không ghi `?page=1`. Chỉ 1 trang
 * thì chỉ hiện dòng tổng số.
 */
export function AdminPagination({
  pagination,
  basePath,
  params = {},
  unit = "mục",
}: {
  pagination: Pagination<unknown>;
  basePath: string;
  params?: Record<string, string | undefined>;
  /** Đơn vị đếm, VD "bài viết", "hồ sơ". */
  unit?: string;
}) {
  const { page, totalPages, total, from, to } = pagination;
  if (total === 0) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const box = "flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-2.5 text-[13px] font-semibold transition-colors";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
      <p className="text-[13px] text-ink-faint">
        Hiển thị <strong className="text-ink">{from}–{to}</strong> / {total} {unit}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-1.5">
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label="Trang trước" className={cn(box, "border-line text-ink-soft hover:border-brand-500 hover:text-brand-700")}>
              ‹
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, "border-line text-ink-faint opacity-40")}>‹</span>
          )}
          {pageNumbers(page, totalPages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-[13px] text-ink-faint">…</span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(box, p === page ? "border-brand-700 bg-brand-700 text-white" : "border-line text-ink-soft hover:border-brand-500 hover:text-brand-700")}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label="Trang sau" className={cn(box, "border-line text-ink-soft hover:border-brand-500 hover:text-brand-700")}>
              ›
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(box, "border-line text-ink-faint opacity-40")}>›</span>
          )}
        </nav>
      )}
    </div>
  );
}
