import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getFaqs } from "@/lib/data/faqs";

export const metadata: Metadata = { title: "Câu hỏi thường gặp" };

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <section className="px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-[820px]">
        <SectionHeading
          eyebrow="Hỏi đáp"
          title="Câu hỏi thường gặp"
          description="Giải đáp nhanh các thắc mắc phổ biến về tuyển sinh, học phí và đào tạo."
        />

        {faqs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-faint">
            Chưa có câu hỏi nào — quản lý qua admin/faq.
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.id}
                className="group rounded-2xl border border-line bg-white px-6 py-4 shadow-sm2"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">
                  {f.question}
                  <svg
                    width="14"
                    height="8"
                    viewBox="0 0 14 8"
                    fill="none"
                    className="shrink-0 text-ink-faint transition-transform group-open:rotate-180"
                  >
                    <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
