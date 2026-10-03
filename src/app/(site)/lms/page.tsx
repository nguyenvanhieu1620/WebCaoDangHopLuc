import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Cổng LMS VNPT" };

export default async function LmsPage() {
  const settings = await getSiteSettings();
  const hasRealLink = settings.lmsUrl && settings.lmsUrl !== "#";

  return (
    <>
      <PageHero
        crumbs={[{ label: "Cổng LMS VNPT" }]}
        eyebrow="Học trực tuyến"
        title="Cổng LMS VNPT"
        description="Hệ thống học trực tuyến LMS VNPT dành cho sinh viên, giảng viên — dùng chung tài khoản đã được nhà trường cấp để đăng nhập."
      >
        {hasRealLink && <Button href={settings.lmsUrl}>Truy cập LMS VNPT →</Button>}
      </PageHero>
      <DecorativeSection contentClassName="mx-auto max-w-2xl text-center">
        {hasRealLink ? (
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Gặp sự cố đăng nhập? Liên hệ phòng Đào tạo qua hotline {settings.hotline} để được cấp lại tài khoản.
          </p>
        ) : (
          <div className="mx-auto w-fit rounded-2xl border border-line bg-white px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint shadow-sm2">
            Link LMS VNPT chưa được cập nhật — quản lý qua admin/cai-dat
          </div>
        )}
      </DecorativeSection>
    </>
  );
}
