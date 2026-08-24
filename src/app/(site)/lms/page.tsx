import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata: Metadata = { title: "Cổng LMS VNPT" };

export default async function LmsPage() {
  const settings = await getSiteSettings();
  const hasRealLink = settings.lmsUrl && settings.lmsUrl !== "#";

  return (
    <section className="px-6 py-24 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow tone="blue" className="mb-6">
          Học trực tuyến
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          Cổng LMS VNPT
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-ink-soft">
          Hệ thống học trực tuyến LMS VNPT dành cho sinh viên, giảng viên —
          dùng chung tài khoản đã được nhà trường cấp để đăng nhập.
        </p>

        <div className="mt-9">
          {hasRealLink ? (
            <Button href={settings.lmsUrl}>Truy cập LMS VNPT →</Button>
          ) : (
            <div className="mx-auto w-fit rounded-2xl border border-line bg-white px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink-faint shadow-sm2">
              Link LMS VNPT chưa được cập nhật — quản lý qua admin/cai-dat
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
