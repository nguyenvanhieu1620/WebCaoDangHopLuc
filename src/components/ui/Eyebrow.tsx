import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: string;
  tone?: "blue" | "red" | "dark" | "onDark";
  className?: string;
};

const TONE_CLASSES: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  blue: "bg-brand-100 text-brand-800",
  red: "bg-accent-100 text-accent-700",
  dark: "bg-brand-900 text-white",
  onDark: "bg-white/12 text-white",
};

const DOT_CLASSES: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  blue: "bg-brand-700 shadow-[0_0_0_4px_rgba(11,108,176,0.18)]",
  red: "bg-accent-500 shadow-[0_0_0_4px_rgba(232,86,47,0.25)]",
  dark: "bg-accent-500 shadow-[0_0_0_4px_rgba(232,86,47,0.25)]",
  onDark: "bg-accent-500 shadow-[0_0_0_4px_rgba(232,86,47,0.25)]",
};

/** Nhãn nhỏ dạng "chip" đặt phía trên tiêu đề section, có chấm nhấp nháy. */
export function Eyebrow({ children, tone = "blue", className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className={cn("dot-pulse h-2 w-2 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}
