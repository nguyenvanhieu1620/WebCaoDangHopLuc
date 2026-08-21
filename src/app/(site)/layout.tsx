import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSiteSettings } from "@/lib/data/site-settings";

/**
 * Layout dùng chung cho mọi trang công khai (route group "(site)").
 * Mọi trang trong nhóm này tự động có header + footer, không cần tự import lại.
 * Lấy `site_settings` 1 lần ở đây rồi truyền xuống Header/Footer qua prop.
 */
export default async function SiteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <div className="bg-paper">
      <SiteHeader settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
