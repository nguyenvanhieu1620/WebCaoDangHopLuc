import type { Metadata } from "next";
import { LookupForm } from "@/components/site/LookupForm";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Tra cứu kết quả xét tuyển" };

export default function AdmissionsLookupPage() {
  return (
    <>
      <PageHero bannerKey="tra-cuu-ket-qua"
        crumbs={[{ label: "Tuyển sinh", href: "/tuyen-sinh" }, { label: "Tra cứu kết quả" }]}
        eyebrow="Tra cứu kết quả"
        title="Tra cứu kết quả xét tuyển"
        description="Nhập số CCCD đã dùng khi đăng ký để xem trạng thái hồ sơ."
      />
      <DecorativeSection contentClassName="mx-auto max-w-2xl">
        <LookupForm />
      </DecorativeSection>
    </>
  );
}
