import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LookupForm } from "@/components/site/LookupForm";

export const metadata: Metadata = { title: "Tra cứu kết quả xét tuyển" };

export default function AdmissionsLookupPage() {
  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow tone="blue" className="mb-6">
          Tra cứu kết quả
        </Eyebrow>
        <h1 className="font-display text-[32px] font-semibold leading-tight text-brand-900">
          Tra cứu kết quả xét tuyển
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-ink-soft">
          Nhập số CCCD đã dùng khi đăng ký để xem trạng thái hồ sơ.
        </p>

        <div className="mt-10 text-left">
          <LookupForm />
        </div>
      </div>
    </section>
  );
}
