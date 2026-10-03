import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QuickContactWidget } from "@/components/site/QuickContactWidget";
import { MobileActionBar } from "@/components/site/MobileActionBar";
import { BackToTop } from "@/components/site/BackToTop";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getNavTree } from "@/lib/data/nav";
import { getLocale } from "@/lib/locale";
import { getQuickContacts } from "@/lib/data/quick-contacts";
import { getPrograms } from "@/lib/data/programs";

/**
 * Layout dùng chung cho mọi trang công khai (route group "(site)").
 * Mọi trang trong nhóm này tự động có header + footer, không cần tự import lại.
 * Lấy `site_settings` + cây menu 1 lần ở đây rồi truyền xuống Header/Footer qua prop.
 * `pb-[76px] lg:pb-0`: chừa chỗ cho thanh MobileActionBar dính đáy trên mobile.
 */
export default async function SiteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, navTree, locale, contacts, programs] = await Promise.all([
    getSiteSettings(),
    getNavTree(),
    getLocale(),
    getQuickContacts(),
    getPrograms(),
  ]);
  return (
    <div className="bg-paper pb-[76px] lg:pb-0">
      <SiteHeader settings={settings} navTree={navTree} locale={locale} />
      <main>{children}</main>
      <SiteFooter settings={settings} programs={programs} />
      <QuickContactWidget contacts={contacts} />
      <BackToTop />
      <MobileActionBar settings={settings} locale={locale} />
    </div>
  );
}
