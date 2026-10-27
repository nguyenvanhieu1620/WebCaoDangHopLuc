import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { ParallaxBlur } from "./ParallaxBlur";

type DecorativeSectionProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Tắt chuyển động của lớp bọc khi chứa form/neo cuộn cần vị trí ổn định. */
  reveal?: boolean;
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
 *
 * 2 khối blur trang trí giờ có `ParallaxBlur` (di chuyển lệch tốc độ nhẹ so
 * với nội dung khi cuộn, tạo chiều sâu) — xem CLAUDE.md mục 5.
 */
export function DecorativeSection({ children, className, contentClassName, reveal = true }: DecorativeSectionProps) {
  return (
    // `overflow-clip` (không phải overflow-hidden): vẫn cắt khối blur tràn ra
    // ngoài nhưng KHÔNG tạo vùng cuộn riêng — nhờ vậy phần tử `sticky` bên trong
    // (VD form đăng ký ở /tuyen-sinh) vẫn dính theo cuộn trang được.
    <section className={cn("relative overflow-clip px-6 py-20 sm:px-8", className)}>
      <ParallaxBlur
        speed={0.12}
        className="pointer-events-none absolute -top-40 -left-28 h-[420px] w-[420px] rounded-full bg-brand-500/15 blur-[60px]"
      />
      <ParallaxBlur
        speed={-0.12}
        className="pointer-events-none absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-accent-500/10 blur-[60px]"
      />
      {reveal ? <Reveal className={cn("relative", contentClassName)}>{children}</Reveal> : <div className={cn("relative", contentClassName)}>{children}</div>}
    </section>
  );
}
