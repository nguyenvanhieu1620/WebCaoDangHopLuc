import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  eyebrowTone?: "blue" | "red" | "dark" | "onDark";
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  onDark?: boolean;
  className?: string;
};

/**
 * Tiêu đề chuẩn cho mỗi section: eyebrow chip + heading (font-display — Montserrat) + mô tả ngắn.
 * Dùng lại xuyên suốt các trang để giữ nhịp điệu thị giác đồng nhất.
 * Mỗi phần hiện LỆCH NHỊP theo cuộn (nhãn → tiêu đề → mô tả, kiểu WOW fadeInUp
 * từng phần tử của VinUni) — mỗi phần bọc 1 `Reveal` riêng với `delay` tăng dần.
 */
export function SectionHeading({
  eyebrow,
  eyebrowTone = "blue",
  title,
  description,
  align = "center",
  onDark = false,
  className,
}: SectionHeadingProps) {
  // `cn()` chỉ nối chuỗi (không gộp như tailwind-merge) — nếu truyền `mb-0` mà
  // vẫn giữ `mb-14` mặc định thì mb-14 thắng trong CSS sinh ra. Có class mb-*
  // truyền vào thì bỏ hẳn mặc định.
  const customMargin = /(^|\s)mb-/.test(className ?? "");
  return (
    <div
      className={cn(
        !customMargin && "mb-14",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <Reveal className={cn("mb-4", align === "center" && "flex justify-center")}>
          <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={90}>
        <h2
          className={cn(
            "text-balance font-display text-[32px] font-semibold leading-[1.1] tracking-tight sm:text-[42px]",
            onDark ? "text-white" : "text-brand-900"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={180}>
          <p
            className={cn(
              "mt-3.5 text-[15.5px] leading-relaxed",
              onDark ? "text-white/65" : "text-ink-soft"
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
