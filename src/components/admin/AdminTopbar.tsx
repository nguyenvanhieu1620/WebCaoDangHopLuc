"use client";

import { useAdminMobileMenu } from "@/components/admin/AdminMobileMenuContext";
import { useCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminIcon } from "@/components/admin/AdminIcon";

type AdminTopbarProps = {
  title: string;
  description?: string;
  /** Nút/thao tác riêng của trang (VD "Xuất Excel") — hiện cạnh nút Tìm nhanh. */
  actions?: React.ReactNode;
};

/** Thanh tiêu đề trên cùng của mỗi trang trong khu vực quản trị. */
export function AdminTopbar({ title, description, actions }: AdminTopbarProps) {
  const { toggle } = useAdminMobileMenu();
  const palette = useCommandPalette();

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-white/85 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Mở menu quản trị"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line lg:hidden"
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
          </div>
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[22px] font-bold text-ink">{title}</h1>
          {description && (
            <p className="mt-0.5 truncate text-[13px] text-ink-faint">{description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {actions}
        <button
          type="button"
          onClick={palette.open}
          aria-label="Tìm nhanh (Ctrl K)"
          className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-ink-faint transition-colors hover:border-brand-500 hover:text-brand-700"
        >
          <AdminIcon name="search" className="h-4 w-4" />
          <span className="hidden md:inline">Tìm nhanh</span>
          <kbd className="hidden rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] md:inline">Ctrl K</kbd>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-10 items-center gap-1.5 rounded-xl border border-line px-4 text-sm font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 sm:flex"
        >
          Xem website <AdminIcon name="external" className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
