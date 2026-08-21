type AdminTopbarProps = {
  title: string;
  description?: string;
};

/** Thanh tiêu đề trên cùng của mỗi trang trong khu vực quản trị. */
export function AdminTopbar({ title, description }: AdminTopbarProps) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line bg-white px-8 py-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-ink">{title}</h1>
        {description && (
          <p className="mt-0.5 text-[13px] text-ink-faint">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
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
