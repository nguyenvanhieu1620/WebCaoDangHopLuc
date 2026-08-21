import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";
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
 * Tiêu đề chuẩn cho mỗi section: eyebrow chip + heading (font Fraunces) + mô tả ngắn.
 * Dùng lại xuyên suốt các trang để giữ nhịp điệu thị giác đồng nhất.
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
  return (
    <div
      className={cn(
        "mb-14",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl",
        className
      )}
    >
      {eyebrow && (
        <div className={cn("mb-4", align === "center" && "flex justify-center")}>
          <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2
        className={cn(
          "font-display text-4xl font-semibold leading-tight",
          onDark ? "text-white" : "text-brand-900"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-3.5 text-[15.5px] leading-relaxed",
            onDark ? "text-white/65" : "text-ink-soft"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
