import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getNavTree } from "@/lib/data/nav";

/**
 * Layout dùng chung cho mọi trang công khai (route group "(site)").
 * Mọi trang trong nhóm này tự động có header + footer, không cần tự import lại.
 * Lấy `site_settings` + cây menu 1 lần ở đây rồi truyền xuống Header/Footer qua prop.
 */
export default async function SiteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, navTree] = await Promise.all([getSiteSettings(), getNavTree()]);
  return (
    <div className="bg-paper">
      <SiteHeader settings={settings} navTree={navTree} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
