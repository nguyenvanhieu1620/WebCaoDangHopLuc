import type { SiteSettings } from "@/lib/db/schema";

export type SocialNetwork = "facebook" | "zalo" | "youtube";

const NETWORKS = [
  { network: "facebook", label: "Facebook", field: "facebookUrl" },
  { network: "zalo", label: "Zalo", field: "zaloUrl" },
  { network: "youtube", label: "YouTube", field: "youtubeUrl" },
] as const;

/** Nền màu nhận diện của từng mạng (class viết đủ để Tailwind sinh CSS) — token `social-*` trong tailwind.config.ts. */
export const SOCIAL_BG: Record<SocialNetwork, string> = {
  facebook: "bg-social-facebook hover:bg-social-facebook-dark",
  zalo: "bg-social-zalo hover:bg-social-zalo-dark",
  youtube: "bg-social-youtube hover:bg-social-youtube-dark",
};

/**
 * Các mạng xã hội admin đã điền link (admin/cai-dat). `getSiteSettings()` đã chuẩn hoá link —
 * mạng chưa có link hoặc link không hợp lệ mang giá trị "#" và bị bỏ qua.
 */
export function socialLinks(settings: Pick<SiteSettings, "facebookUrl" | "zaloUrl" | "youtubeUrl">) {
  return NETWORKS.map((n) => ({ network: n.network, label: n.label, href: settings[n.field] })).filter(
    (l) => l.href && l.href !== "#"
  );
}

/**
 * Biểu tượng mạng xã hội (1 màu, theo `currentColor`) — thay cho chữ "FB/ZL/YT" trước đây.
 * Chữ "f" của Facebook: Font Awesome Free (CC BY 4.0, https://fontawesome.com/license/free);
 * YouTube: Simple Icons (CC0). Zalo không có biểu tượng chữ ký riêng — dùng đúng chữ "Zalo"
 * như logo của hãng.
 */
export function SocialIcon({ network, size = 20 }: { network: SocialNetwork; size?: number }) {
  if (network === "zalo") {
    return (
      <span aria-hidden className="font-extrabold leading-none tracking-tight" style={{ fontSize: Math.round(size * 0.56) }}>
        Zalo
      </span>
    );
  }
  if (network === "facebook") {
    return (
      <svg aria-hidden width={size} height={size} viewBox="0 0 320 512" fill="currentColor">
        <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
