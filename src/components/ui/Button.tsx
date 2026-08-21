import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "ghostLight";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent-600 to-accent-500 text-white shadow-red hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(196,30,36,0.34)]",
  outline:
    "bg-transparent border-[1.5px] border-brand-700 text-brand-700 hover:bg-brand-700 hover:text-white hover:-translate-y-0.5",
  ghostLight:
    "bg-white/10 border border-white/30 text-white hover:bg-white/20",
};

type ButtonProps = {
  href?: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

/** Nút bấm dùng chung toàn site — mặc định kiểu "primary" (đỏ, dùng cho CTA). */
export function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200",
    VARIANT_CLASSES[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
