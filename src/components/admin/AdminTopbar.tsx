"use client";

import { useAdminMobileMenu } from "@/components/admin/AdminMobileMenuContext";

type AdminTopbarProps = {
  title: string;
  description?: string;
};

/** Thanh tiêu đề trên cùng của mỗi trang trong khu vực quản trị. */
export function AdminTopbar({ title, description }: AdminTopbarProps) {
  const { toggle } = useAdminMobileMenu();

  return (
    <div className="flex items-center justify-between gap-6 border-b border-line bg-white px-5 py-5 sm:px-8">
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
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-56 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button
          aria-label="Thông báo"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line"
        >
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-600" />
          🔔
        </button>
      </div>
    </div>
  );
}
