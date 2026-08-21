import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { programGradient } from "@/lib/constants";
import { getFeaturedPrograms, getPrograms } from "@/lib/data/programs";
import { getHomepageContent } from "@/lib/data/homepage";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const featuredPrograms = await getFeaturedPrograms();
  const allPrograms = await getPrograms();
  const content = await getHomepageContent();
  const { stats: STATS, features: FEATURES, steps: STEPS } = content;
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-8 sm:pt-20">
        <div className="pointer-events-none absolute -top-44 -right-40 h-[560px] w-[560px] rounded-full bg-brand-500/20 blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 h-[520px] w-[520px] rounded-full bg-accent-500/10 blur-[60px]" />

        <div className="relative mx-auto grid max-w-[1220px] items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <Eyebrow tone="dark" className="mb-6">
              {content.heroBadge}
            </Eyebrow>
            <h1 className="font-display text-[42px] font-bold leading-[1.08] text-brand-900 sm:text-[56px]">
              {content.heroTitleLine1}
              <br />
              <em className="bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text font-medium italic text-transparent">
                {content.heroTitleLine2}
              </em>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              {content.heroDescription}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/tuyen-sinh">Đăng ký xét tuyển</Button>
              <Button href="/nganh-dao-tao" variant="outline">
                Xem ngành đào tạo
              </Button>
            </div>
          </div>

          <div className="relative h-[420px] sm:h-[480px]">
            <div className="absolute inset-0 right-4 bottom-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 shadow-lg2">
              <div className="absolute left-6 bottom-6 right-6 text-white">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-white/65">
                  {content.heroImageCardLabel}
                </div>
                <h4 className="mt-1.5 max-w-[280px] font-display text-lg font-medium leading-snug">
                  {content.heroImageCardTitle}
                </h4>
              </div>
            </div>
            <div className="absolute right-0 top-5 w-[210px] rounded-2xl border border-white/60 bg-white/85 p-4 shadow-md2 backdrop-blur-md">
              <div className="text-[13px] tracking-widest text-accent-500">★★★★★</div>
              <div className="font-display text-2xl font-semibold text-brand-900">
                {content.heroRatingValue}
                <span className="text-[13px] font-sans text-ink-faint">/5</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-soft">
                {content.heroRatingText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-y border-line bg-white px-6 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1220px] grid-cols-2 gap-5 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl border-t-[3px] bg-white p-6 shadow-sm2",
                i % 2 === 0 ? "border-t-brand-700" : "border-t-accent-600"
              )}
            >
              <div className="font-display text-3xl font-semibold text-brand-900">
                {s.value}
              </div>
              <div className="mt-1 text-[12.5px] text-ink-soft">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1220px]">
          <SectionHeading
            eyebrow="Vì sao chọn Hợp Lực"
            title="Học thật, hành thật, ra trường có nghề ngay"
            description="Không chỉ là kiến thức trên giảng đường — sinh viên Hợp Lực được thực hành lâm sàng thật từ năm nhất."
          />
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-line bg-white p-7 transition-transform hover:-translate-y-1 hover:shadow-md2"
              >
                <h3 className="font-display text-lg font-semibold text-brand-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.8px] leading-relaxed text-ink-soft">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROGRAMS ============ */}
      <section className="bg-paper-alt px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1220px]">
          <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-lg font-display text-[34px] font-semibold leading-tight text-brand-900">
              Ngành đào tạo — chọn đúng nghề, học đúng chuẩn
            </h2>
            <Link
              href="/nganh-dao-tao"
              className="text-sm font-semibold text-brand-700 hover:text-accent-600"
            >
              Xem tất cả {allPrograms.length} ngành →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.map((p, i) => (
              <Link
                key={p.slug}
                href={`/nganh-dao-tao/${p.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm2 transition-all hover:-translate-y-1.5 hover:shadow-lg2"
              >
                <div
                  className={cn(
                    "flex h-[100px] items-end bg-gradient-to-br p-5",
                    programGradient(i)
                  )}
                >
                  <span className="font-display text-2xl font-bold text-white/90">
                    {p.code}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold text-brand-900">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-[13.3px] leading-relaxed text-ink-soft">
                    {p.summary}
                  </p>
                  <div className="mt-4 flex gap-4 border-t border-line pt-3.5 text-[11.5px] text-ink-faint">
                    <span>
                      <b className="font-semibold text-ink-soft">{p.duration}</b> đào tạo
                    </span>
                    <span>
                      <b className="font-semibold text-ink-soft">{p.intake}</b> chỉ tiêu
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1220px]">
          <SectionHeading
            eyebrow="Quy trình xét tuyển"
            eyebrowTone="red"
            title="4 bước, 48 giờ có kết quả"
            description="Nộp hồ sơ trực tuyến, không cần đến trường trong bước đầu."
          />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-700 font-mono text-[13px] font-semibold text-brand-700">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display text-base font-semibold text-brand-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="px-6 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-[1220px] overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-900 to-brand-700 px-8 py-14 sm:px-14">
          <div className="pointer-events-none absolute -top-28 -right-16 h-80 w-80 rounded-full bg-accent-500/25 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="max-w-md font-display text-[28px] font-semibold leading-snug text-white sm:text-[32px]">
                {content.ctaTitle}
              </h2>
              <p className="mt-3 max-w-sm text-[14.5px] text-white/70">
                {content.ctaDescription}
              </p>
            </div>
            <div className="flex shrink-0 gap-3.5">
              <Button href="/tuyen-sinh">Đăng ký tư vấn ngay</Button>
              <Button href="/lien-he" variant="ghostLight">
                Gọi hotline
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
