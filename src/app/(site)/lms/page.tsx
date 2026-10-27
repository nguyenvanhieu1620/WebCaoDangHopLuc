import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = { title: "Cổng LMS VNPT" };

export default async function LmsPage() {
  const settings = await getSiteSettings();
  const en = (await getLocale()) === "en";
  const hasRealLink = settings.lmsUrl && settings.lmsUrl !== "#";

  return (
    <>
      <PageHero bannerKey="lms"
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
          <div className="mx-auto rounded-2xl border border-brand-100 bg-white p-8 shadow-sm2">
            <h2 className="font-display text-xl font-semibold text-brand-900">{en ? "The learning portal is being updated" : "Cổng học trực tuyến đang được cập nhật"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{en ? "Please contact the college for the current login link and account support." : "Sinh viên và giảng viên vui lòng liên hệ nhà trường để nhận đường dẫn đăng nhập và được hỗ trợ tài khoản."}</p>
            <Button href={`tel:${settings.hotline.replace(/[^+\d]/g, "")}`} className="mt-5">{en ? "Call" : "Gọi hỗ trợ"}: {settings.hotline}</Button>
          </div>
        )}
      </DecorativeSection>
    </>
  );
}
