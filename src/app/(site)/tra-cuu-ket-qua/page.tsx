import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { LookupForm } from "@/components/site/LookupForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pageText(await getLocale());
  return { title: copy("Tra cứu kết quả xét tuyển") };
}

export default async function AdmissionsLookupPage() {
  const copy = pageText(await getLocale());
  return (
    <>
      <PageHero bannerKey="tra-cuu-ket-qua"
        crumbs={[{ label: copy("Tuyển sinh"), href: "/tuyen-sinh" }, { label: copy("Tra cứu kết quả") }]}
        eyebrow={copy("Tra cứu kết quả")}
        title={copy("Tra cứu kết quả xét tuyển")}
        description={copy("Nhập số CCCD đã dùng khi đăng ký để xem trạng thái hồ sơ.")}
      />
      <DecorativeSection contentClassName="mx-auto max-w-2xl">
        <LookupForm locale={await getLocale()} />
      </DecorativeSection>
    </>
  );
}
