import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type DecorativeSectionProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Khung section dùng chung cho MỌI trang công khai bên trong "(site)" trừ
 * Trang chủ (đã có bố cục riêng nhiều khối) — gồm gradient blur trang trí
 * phía sau + hiệu ứng cuộn mờ-dần (Reveal), đúng ngôn ngữ thị giác Trang chủ
 * đang dùng (`page.tsx` mục Hero). Trước đây mỗi trang con chỉ có
 * `<section className="px-6 py-20 sm:px-8">` trần, không hiệu ứng/trang trí
 * gì — khiến Trang chủ (sống động) và trang con (phẳng, tĩnh) lệch hẳn độ
 * hoàn thiện thị giác, người dùng nhận xét đúng là "rời rạc" (xem CLAUDE.md
 * mục 5 "Mở rộng hiệu ứng + trang trí ra toàn bộ trang con").
 *
 * `className` chỉ nên thêm class KHÔNG xung đột với `px-6 py-20 sm:px-8`
 * mặc định (VD `bg-paper-alt`) — `cn()` trong dự án chỉ nối chuỗi thuần,
 * không gộp thông minh như tailwind-merge, nên 2 class cùng thuộc tính
 * (VD `py-20` với `py-24`) sẽ áp dụng không rõ class nào thắng.
 */
export function DecorativeSection({ children, className, contentClassName }: DecorativeSectionProps) {
  return (
    <section className={cn("relative overflow-hidden px-6 py-20 sm:px-8", className)}>
      <div className="pointer-events-none absolute -top-40 -left-28 h-[420px] w-[420px] rounded-full bg-brand-500/15 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-accent-500/10 blur-[60px]" />
      <Reveal className={cn("relative", contentClassName)}>{children}</Reveal>
    </section>
  );
}
