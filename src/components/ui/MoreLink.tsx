import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Link "Xem tất cả" ở đầu các khối — kiểu nút "XEM THÊM" của VinUni: chữ in
 * hoa đậm, tam giác đỏ phía trước, gạch chân đỏ chạy ra từ trái khi rê chuột
 * (CSS `.link-underline` trong globals.css). Thay cho nút viên thuốc cũ.
 */
export function MoreLink({
  href,
  children,
  onDark,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5 py-1 text-[12.5px] font-bold uppercase tracking-[0.14em] transition-colors",
        onDark ? "text-white" : "text-brand-900 hover:text-brand-700",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-accent-600 transition-transform duration-300 group-hover:translate-x-1"
      />
      <span className="link-underline">{children}</span>
    </Link>
  );
}
