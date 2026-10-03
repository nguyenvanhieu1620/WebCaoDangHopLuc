import { Reveal } from "@/components/site/Reveal";
import type { Faq } from "@/lib/db/schema";

/**
 * Danh sách câu hỏi mở/đóng bằng `<details>` HTML thuần (không JS) — dùng
 * chung cho /faq và khối "Câu hỏi thường gặp" cuối /tuyen-sinh.
 */
export function FaqList({ faqs }: { faqs: Pick<Faq, "id" | "question" | "answer">[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((f, i) => (
        <Reveal key={f.id} delay={Math.min(i, 6) * 55}>
          <details className="group rounded-2xl border border-line bg-white px-6 py-4 shadow-sm2 transition-colors open:border-brand-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">
              <span className="flex gap-3">
                <span className="font-mono text-[11px] leading-[22px] text-accent-600">{String(i + 1).padStart(2, "0")}</span>
                {f.question}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-faint transition-all group-open:rotate-45 group-open:border-accent-600 group-open:bg-accent-600 group-open:text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
            </summary>
            <p className="mt-3 pl-7 text-[14px] leading-relaxed text-ink-soft">{f.answer}</p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
