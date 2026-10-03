import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageStub } from "@/components/ui/PageStub";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MoreLink } from "@/components/ui/MoreLink";
import { DecorativeSection } from "@/components/site/DecorativeSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { TiltCard } from "@/components/site/TiltCard";
import { CountUp } from "@/components/site/CountUp";
import { MilestoneTimeline } from "@/components/site/MilestoneTimeline";
import { getPageBySlug } from "@/lib/data/pages";
import { getHomepageContent } from "@/lib/data/homepage";
import { getMilestoneYears } from "@/lib/data/milestones";

export const metadata: Metadata = { title: "Giới thiệu" };

/**
 * Giới thiệu nhiều khối kiểu trang "Về VinUni": nội dung chung (trang tĩnh
 * `gioi-thieu`) → Sứ mệnh/Tầm nhìn + 4 con số (lấy lại từ Nội dung Trang chủ,
 * không nhập 2 lần) → dòng thời gian Cột mốc (admin/cot-moc). Khối nào chưa có
 * dữ liệu thì tự ẩn; mục lục bên trái chỉ liệt kê khối đang hiện.
 */
export default async function AboutPage() {
  const [page, content, milestoneYears] = await Promise.all([
    getPageBySlug("gioi-thieu"),
    getHomepageContent(),
    getMilestoneYears(),
  ]);

  if (!page) {
    return (
      <PageStub
        eyebrow="Giới thiệu"
        title="Về Trường Cao đẳng Y Dược Hợp Lực"
        description="Sứ mệnh, lịch sử hình thành, cơ sở vật chất và đội ngũ lãnh đạo nhà trường."
      />
    );
  }

  const hasMission = !!(content.missionText || content.visionText);
  const toc = [
    { id: "gioi-thieu-chung", label: "Giới thiệu chung" },
    hasMission && { id: "su-menh-tam-nhin", label: "Sứ mệnh & Tầm nhìn" },
    content.stats.length > 0 && { id: "con-so", label: "Hợp Lực qua những con số" },
    milestoneYears.length > 0 && { id: "cot-moc", label: "Những cột mốc" },
  ].filter((x): x is { id: string; label: string } => !!x);

  return (
    <>
      <PageHero crumbs={[{ label: "Giới thiệu" }]} eyebrow="Giới thiệu" title={page.title} imageUrl={page.coverImageUrl} />

      <DecorativeSection contentClassName="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Trên trang này</div>
          <nav aria-label="Mục lục trang Giới thiệu" className="mt-4">
            <ol className="space-y-1 border-l-2 border-line">
              {toc.map((t, i) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="group -ml-0.5 flex items-center gap-3 border-l-2 border-transparent py-2 pl-4 text-[14px] font-semibold text-ink-soft transition-colors hover:border-accent-600 hover:text-brand-900">
                    <span className="font-mono text-[10.5px] text-ink-faint group-hover:text-accent-600">{String(i + 1).padStart(2, "0")}</span>
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div id="gioi-thieu-chung" className="scroll-mt-28">
          <Eyebrow tone="red" className="mb-5">
            Giới thiệu chung
          </Eyebrow>
          <MarkdownContent content={page.content} />
        </div>
      </DecorativeSection>

      {hasMission && (
        <section id="su-menh-tam-nhin" className="scroll-mt-24 bg-paper-alt px-6 py-24 sm:px-8">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading eyebrow="Định hướng" title="Sứ mệnh & Tầm nhìn" />
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { text: content.missionText, label: "Sứ mệnh", tone: "blue" as const },
                { text: content.visionText, label: "Tầm nhìn", tone: "red" as const },
              ]
                .filter((b) => b.text)
                .map((b, i) => (
                  <Reveal key={b.label} delay={i * 120} className="h-full">
                    <TiltCard max={4} className="h-full rounded-[24px] border border-line bg-white p-9 shadow-sm2">
                      <Eyebrow tone={b.tone} className="mb-5">
                        {b.label}
                      </Eyebrow>
                      <p className="font-display text-[19px] leading-relaxed text-brand-900 sm:text-[21px]">
                        <span className="mr-1 font-display text-[40px] leading-none text-accent-500/50">“</span>
                        {b.text}
                      </p>
                    </TiltCard>
                  </Reveal>
                ))}
            </div>
          </div>
        </section>
      )}

      {content.stats.length > 0 && (
        <section id="con-so" className="relative isolate scroll-mt-24 overflow-hidden bg-gradient-to-br from-brand-900 to-brand-800 px-6 py-20 text-white sm:px-8">
          <div className="bg-grid-dark pointer-events-none absolute inset-0" />
          <div className="relative mx-auto max-w-[1180px]">
            <SectionHeading eyebrow="Con số" eyebrowTone="onDark" title="Hợp Lực qua những con số" onDark className="mb-12" />
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-white/10 lg:grid-cols-4">
              {content.stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 90} className="bg-brand-900/60 px-6 py-8 text-center backdrop-blur">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className={i % 2 ? "font-display text-[44px] font-bold leading-none text-accent-400" : "font-display text-[44px] font-bold leading-none"}>
                    <CountUp value={s.value} />
                  </dd>
                  <dd className="mt-3 text-[13.5px] text-brand-100/80">{s.label}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      )}

      {milestoneYears.length > 0 && (
        <section id="cot-moc" className="scroll-mt-24 px-6 py-24 sm:px-8">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading
              eyebrow="Lịch sử"
              eyebrowTone="red"
              title={
                <>
                  Những cột mốc <em className="font-medium italic text-accent-600">Hợp Lực</em>
                </>
              }
              description="Nhìn lại những dấu mốc trên hành trình xây dựng và phát triển của nhà trường."
            />
            <Reveal>
              <MilestoneTimeline years={milestoneYears} />
            </Reveal>
          </div>
        </section>
      )}

      <section className="px-6 pb-24 sm:px-8">
        <Reveal className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 rounded-[24px] border border-line bg-white px-8 py-7 shadow-sm2">
          <div>
            <div className="font-display text-[22px] font-semibold text-brand-900">Tìm hiểu các ngành đào tạo của trường</div>
            <p className="mt-1 text-[14px] text-ink-soft">Chương trình, thời gian đào tạo, chỉ tiêu và học phí từng ngành.</p>
          </div>
          <MoreLink href="/nganh-dao-tao">Xem ngành đào tạo</MoreLink>
        </Reveal>
      </section>
    </>
  );
}
