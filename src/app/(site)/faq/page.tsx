import type { Metadata } from "next";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { FaqList } from "@/components/site/FaqList";
import { getFaqs } from "@/lib/data/faqs";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <PageHero
        crumbs={[{ label: "Câu hỏi thường gặp" }]}
        eyebrow="Hỏi đáp"
        title="Câu hỏi thường gặp"
        description="Giải đáp nhanh các thắc mắc phổ biến về tuyển sinh, học phí và đào tạo."
      />
      <DecorativeSection contentClassName="mx-auto max-w-[820px]">
        {faqs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có câu hỏi nào — quản lý qua admin/faq.
          </div>
        ) : (
          <FaqList faqs={faqs} />
        )}
      </DecorativeSection>
    </>
  );
}
