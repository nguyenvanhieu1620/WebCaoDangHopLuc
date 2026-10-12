import Link from "next/link";
import type { SiteSettings } from "@/lib/db/schema";
import type { Locale } from "@/lib/locale";

const TEXT = {
  vi: { call: "Gọi ngay", zalo: "Zalo", lookup: "Tra cứu", apply: "Đăng ký xét tuyển", label: "Thao tác nhanh" },
  en: { call: "Call", zalo: "Zalo", lookup: "Status", apply: "Apply now", label: "Quick actions" },
};

/**
 * Thanh hành động dính đáy màn hình — CHỈ hiện trên điện thoại/máy tính bảng
 * (< lg), kiểu các trường cao đẳng y dược VN hay dùng: Gọi hotline / Zalo /
 * Đăng ký xét tuyển luôn trong tầm ngón cái. Zalo chưa cấu hình ("#") thì
 * thay bằng "Tra cứu". `(site)/layout.tsx` chừa khoảng trống đáy (pb) trên
 * mobile để thanh này không che nội dung cuối trang/footer.
 */
export function MobileActionBar({
  settings,
  locale,
}: {
  settings: Pick<SiteSettings, "hotline" | "zaloUrl">;
  locale: Locale;
}) {
  const t = TEXT[locale];
  const hasZalo = !!settings.zaloUrl && settings.zaloUrl !== "#";
  const itemClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-ink-soft active:bg-brand-50";

  return (
    <nav
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/[0.97] px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-10px_30px_-12px_rgba(6,50,90,0.25)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-2">
        <a href={`tel:${settings.hotline.replace(/\s+/g, "")}`} className={itemClass}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-600" aria-hidden="true">
            <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.call}
        </a>
        {hasZalo ? (
          <a href={settings.zaloUrl} target="_blank" rel="noopener noreferrer" className={itemClass}>
            <span className="flex h-5 items-center font-display text-[13px] font-bold text-brand-700" aria-hidden="true">Za</span>
            {t.zalo}
          </a>
        ) : (
          <Link href="/tra-cuu-ket-qua" className={itemClass}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-700" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
            {t.lookup}
          </Link>
        )}
        <Link
          href="/tuyen-sinh#dang-ky"
          // Montserrat rộng: rộng hơn + không xuống dòng + chữ nhỏ hơn chút ở máy < 400px (360px vẫn vừa 1 dòng).
          className="flex flex-[2.2] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-2 text-[12.5px] font-bold text-white shadow-red active:scale-[0.98] min-[400px]:gap-2 min-[400px]:text-[13.5px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className="shrink-0">
            <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.apply}
        </Link>
      </div>
    </nav>
  );
}
