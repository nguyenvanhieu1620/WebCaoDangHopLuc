import { safeHref } from "@/lib/safe-href";

export function quickContactHotlineHref(hotline: string): string | null {
  const number = hotline.replace(/[^+\d]/g, "");
  return /^\+?\d+$/.test(number) ? safeHref(`tel:${number}`) : null;
}

export function quickContactHotlineLabel(hotline: string, locale: "vi" | "en" = "vi"): string {
  return `${locale === "en" ? "Call" : "Gọi hotline"} ${hotline}`.trim();
}
