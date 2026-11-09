import { pageText } from "@/lib/page-copy";
import { getLocale } from "@/lib/locale";
import type { Metadata } from "next";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { FaqList } from "@/components/site/FaqList";
import { getFaqs } from "@/lib/data/faqs";

export async function generateMetadata(): Promise<Metadata> {
  const copy = pageText(await getLocale());
  return { title: copy("Câu hỏi thường gặp") };
}

export default async function FaqPage() {
  const copy = pageText(await getLocale());
  const faqs = await getFaqs();

  return (
    <>
      <PageHero bannerKey="faq"
        crumbs={[{ label: copy("Câu hỏi thường gặp") }]}
        eyebrow={copy("Hỏi đáp")}
        title={copy("Câu hỏi thường gặp")}
        description={copy("Giải đáp nhanh các thắc mắc phổ biến về tuyển sinh, học phí và đào tạo.")}
      />
      <DecorativeSection contentClassName="mx-auto max-w-[820px]">
        {faqs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            {copy("Chưa có câu hỏi nào — quản lý qua admin/faq.")}
          </div>
        ) : (
          <FaqList faqs={faqs} />
        )}
      </DecorativeSection>
    </>
  );
}
