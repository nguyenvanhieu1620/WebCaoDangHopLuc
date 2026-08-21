import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  label: string;
  className?: string;
};

/**
 * Khối thay thế khi chưa có ảnh thật (admin chưa upload) — tránh vỡ layout
 * hoặc hiện icon ảnh lỗi. Dùng cho Hero, Thư viện, Giảng viên, Đánh giá, Tin tức.
 */
export function ImagePlaceholder({ label, className }: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-800 via-brand-600 to-brand-400 p-3 text-center",
        className
      )}
    >
      <span className="font-mono text-[10.5px] uppercase tracking-wider text-white/70">
        {label}
      </span>
    </div>
  );
}
