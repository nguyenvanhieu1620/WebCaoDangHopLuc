import type { SiteSettings } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type QuickContactWidgetProps = {
  settings: Pick<SiteSettings, "hotline" | "zaloUrl" | "facebookUrl">;
};

/**
 * Nút liên hệ nhanh nổi góc màn hình (Hotline/Zalo/Facebook) — hiện trên mọi
 * trang công khai, tham khảo th.hopluchospital.com. Không cần bảng DB mới,
 * lấy thẳng từ site_settings đã có. Chức năng thuần (luôn hiện sẵn, không
 * thu/phóng) — hiệu ứng mượt hơn (nếu cần) làm ở đợt sau.
 */
type ContactItem = {
  key: string;
  href: string;
  label: string;
  className: string;
  icon: React.ReactNode;
};

export function QuickContactWidget({ settings }: QuickContactWidgetProps) {
  const candidates: (ContactItem | null)[] = [
    settings.hotline
      ? {
          key: "hotline",
          href: `tel:${settings.hotline.replace(/\s+/g, "")}`,
          label: `Gọi hotline ${settings.hotline}`,
          className: "bg-accent-600 hover:bg-accent-700",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
        }
      : null,
    settings.zaloUrl !== "#"
      ? {
          key: "zalo",
          href: settings.zaloUrl,
          label: "Nhắn tin qua Zalo",
          className: "bg-[#0068FF] hover:bg-[#0055D4]",
          icon: <span className="font-display text-[13px] font-bold">Za</span>,
        }
      : null,
    settings.facebookUrl !== "#"
      ? {
          key: "facebook",
          href: settings.facebookUrl,
          label: "Nhắn tin qua Facebook",
          className: "bg-[#1877F2] hover:bg-[#1461C7]",
          icon: <span className="font-display text-[15px] font-bold">f</span>,
        }
      : null,
  ];
  const items = candidates.filter((item): item is ContactItem => item !== null);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col gap-3 sm:right-6">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target={item.href.startsWith("http") ? "_blank" : undefined}
          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
          aria-label={item.label}
          title={item.label}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg2 transition-colors",
            item.className
          )}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
