/** Số dòng mỗi trang của các danh sách trong admin. */
export const ADMIN_PAGE_SIZE = 20;

export type Pagination<T> = {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  /** Số thứ tự (1-based) dòng đầu / cuối đang hiện — 0 khi danh sách rỗng. */
  from: number;
  to: number;
};

/**
 * Cắt 1 trang từ danh sách đã lọc. Admin lấy hết rồi lọc trong JS (quy mô 1 trường — xem CLAUDE.md) nên
 * phân trang cũng cắt mảng. `rawPage` lấy thẳng từ `searchParams.page`: sai/thiếu → trang 1, vượt quá →
 * trang cuối (VD vừa xoá dòng cuối cùng của trang cuối).
 */
export function paginate<T>(items: T[], rawPage: string | string[] | undefined, size = ADMIN_PAGE_SIZE): Pagination<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const n = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const page = Number.isInteger(n) && n >= 1 ? Math.min(n, totalPages) : 1;
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    page,
    totalPages,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + size, total),
  };
}

/** Các số trang cần hiện: luôn có trang đầu/cuối + 1 trang mỗi bên trang hiện tại, chỗ bị lược thành "…". */
export function pageNumbers(page: number, totalPages: number): (number | "…")[] {
  const keep = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("…");
    out.push(p);
  });
  return out;
}
