import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { HeroImageCarousel } from "@/components/site/HeroImageCarousel";
import { Reveal } from "@/components/site/Reveal";
import { ParallaxBlur } from "@/components/site/ParallaxBlur";
import { ProgramCard } from "@/components/site/ProgramCard";
import { CountUp } from "@/components/site/CountUp";
import { programGradient } from "@/lib/constants";
import { getFeaturedPrograms, getPrograms } from "@/lib/data/programs";
import { getHomepageContent } from "@/lib/data/homepage";
import { getPartners } from "@/lib/data/partners";
import { getGalleryItems } from "@/lib/data/gallery";
import { getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getTestimonials } from "@/lib/data/testimonials";
import { getLatestPublishedPosts } from "@/lib/data/posts";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getHeroBanners } from "@/lib/data/hero-banners";
import { getEvents } from "@/lib/data/events";
import { cn, formatVNDate, formatVNDateTime } from "@/lib/utils";
import type { Event } from "@/lib/db/schema";

/** Lọc + cắt 3 sự kiện sắp diễn ra — hàm thường (không phải component) nên gọi Date.now() ở đây được. */
function upcomingEvents(allEvents: Event[]): Event[] {
  const now = Date.now();
  return allEvents.filter((e) => new Date(e.startAt).getTime() >= now).slice(0, 3);
}

const QUICK_TOOL_ICONS = {
  admission: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lookup: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.35-4.35" strokeLinecap="round" />
    </svg>
  ),
  library: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h4v16H4zM10 4h4v16h-4zM17 5l3 1.2v13.6L17 19z" strokeLinejoin="round" />
    </svg>
  ),
  lms: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  ),
};

export default async function HomePage() {
  const [
    featuredPrograms,
    allPrograms,
    content,
    partners,
    galleryItems,
    facultyList,
    testimonials,
    latestPosts,
    settings,
    heroBanners,
    allEvents,
  ] = await Promise.all([
    getFeaturedPrograms(),
    getPrograms(),
    getHomepageContent(),
    getPartners(),
    getGalleryItems(),
    getFacultyList(),
    getTestimonials(),
    getLatestPublishedPosts(3),
    getSiteSettings(),
    getHeroBanners(),
    getEvents(),
  ]);
  const { stats, features, steps } = content;
  const nextEvents = upcomingEvents(allEvents);

  const quickTools = [
    {
      href: "/tuyen-sinh",
      label: "Đăng ký xét tuyển",
      desc: "Nộp hồ sơ trực tuyến",
      icon: QUICK_TOOL_ICONS.admission,
      iconBg: "bg-brand-700/10 text-brand-700",
    },
    {
      href: "/tra-cuu-ket-qua",
      label: "Tra cứu kết quả",
      desc: "Xem kết quả xét tuyển",
      icon: QUICK_TOOL_ICONS.lookup,
      iconBg: "bg-accent-600/10 text-accent-600",
    },
    {
      href: "/thu-vien",
      label: "Thư viện",
      desc: "Ảnh & tư liệu nhà trường",
      icon: QUICK_TOOL_ICONS.library,
      iconBg: "bg-brand-700/10 text-brand-700",
    },
    {
      href: settings.lmsUrl,
      label: "Cổng học tập LMS",
      desc: "Học liệu điện tử VNPT",
      icon: QUICK_TOOL_ICONS.lms,
      iconBg: "bg-accent-600/10 text-accent-600",
      external: settings.lmsUrl !== "#",
    },
  ];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-8 sm:pt-20">
        <ParallaxBlur
          speed={0.15}
          className="pointer-events-none absolute -top-44 -left-32 h-[560px] w-[560px] rounded-full bg-brand-500/20 blur-[60px]"
        />
        <ParallaxBlur
          speed={-0.15}
          className="pointer-events-none absolute -bottom-56 -right-40 h-[600px] w-[600px] rounded-full bg-accent-500/15 blur-[60px]"
        />

        <Reveal className="relative mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="blue" className="mb-6">
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

          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 rounded-[32px] bg-gradient-to-br from-brand-500/25 to-accent-500/20 blur-[30px]" />
            <div className="relative rounded-[28px] border border-white/85 bg-white/60 p-7 shadow-lg2 backdrop-blur-xl">
              <div className="relative h-[340px] overflow-hidden rounded-[18px]">
                <HeroImageCarousel
                  banners={heroBanners}
                  fallbackImageUrl={content.heroImageUrl}
                  fallbackAlt="Sinh viên thực hành lâm sàng"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3.5">
                <div className="float-y rounded-2xl border border-white/90 bg-white/70 p-4 shadow-md2">
                  <div className="font-mono text-[26px] font-semibold text-brand-700">
                    <CountUp value={content.heroBadge1Value} />
                  </div>
                  <div className="text-xs text-ink-soft">{content.heroBadge1Label}</div>
                </div>
                <div className="rounded-2xl border border-white/90 bg-white/70 p-4 shadow-md2">
                  <div className="font-mono text-[26px] font-semibold text-accent-600">
                    <CountUp value={content.heroBadge2Value} />
                  </div>
                  <div className="text-xs text-ink-soft">{content.heroBadge2Label}</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ CÔNG CỤ NHANH ============ */}
      <section className="px-6 pb-16 sm:px-8">
        <Reveal className="mx-auto grid max-w-[1320px] grid-cols-2 gap-4 lg:grid-cols-4">
          {quickTools.map((tool) => (
            <Link
              key={tool.href + tool.label}
              href={tool.href}
              target={"external" in tool && tool.external ? "_blank" : undefined}
              rel={"external" in tool && tool.external ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-3.5 rounded-2xl border border-line bg-white p-5 shadow-sm2 transition-transform hover:-translate-y-1"
            >
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", tool.iconBg)}>
                {tool.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-ink group-hover:text-brand-700">
                  {tool.label}
                </div>
                <div className="truncate text-[12px] text-ink-faint">{tool.desc}</div>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* ============ ĐỐI TÁC ============ */}
      {partners.length > 0 && (
        <section className="border-y border-line bg-white px-6 py-9 sm:px-8">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-8">
            {partners.map((p, i) => (
              <Reveal key={p.id} delay={i * 50}>
                <span className="font-display text-[15px] font-semibold text-ink-faint">
                  {p.name}
                </span>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ STATS ============ */}
      <section className="px-6 pt-24 sm:px-8">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="rounded-2xl border border-line bg-white p-7 text-center shadow-sm2">
                <div className="font-mono text-4xl font-semibold text-brand-700">
                  <CountUp value={s.value} />
                </div>
                <div className="mt-1.5 text-[13.5px] text-ink-soft">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ SỨ MỆNH - TẦM NHÌN ============ */}
      {(content.missionText || content.visionText) && (
        <section className="px-6 pt-24 sm:px-8">
          <Reveal className="mx-auto grid max-w-[1320px] gap-5 sm:grid-cols-2">
            {content.missionText && (
              <div className="rounded-2xl border border-line bg-white p-8 shadow-sm2">
                <Eyebrow tone="blue" className="mb-4">
                  Sứ mệnh
                </Eyebrow>
                <p className="text-[15px] leading-relaxed text-ink-soft">{content.missionText}</p>
              </div>
            )}
            {content.visionText && (
              <div className="rounded-2xl border border-line bg-white p-8 shadow-sm2">
                <Eyebrow tone="red" className="mb-4">
                  Tầm nhìn
                </Eyebrow>
                <p className="text-[15px] leading-relaxed text-ink-soft">{content.visionText}</p>
              </div>
            )}
          </Reveal>
        </section>
      )}

      {/* ============ FEATURES ============ */}
      <section className="px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <Reveal>
            <SectionHeading
              eyebrow="Vì sao chọn Hợp Lực"
              title="Đào tạo thực chiến, đồng hành đến khi có việc làm"
            />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div className="rounded-[22px] border border-white/90 bg-white/70 p-8 shadow-md2 backdrop-blur-md transition-transform hover:-translate-y-1.5">
                  <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 shadow-blue">
                    <div className="h-5 w-5 rounded-md bg-white" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-soft">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROGRAMS ============ */}
      <section className="bg-paper-alt px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mb-11 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow tone="blue" className="mb-3">
                Ngành đào tạo
              </Eyebrow>
              <h2 className="font-display text-[34px] font-semibold leading-tight text-brand-900">
                {allPrograms.length} ngành trọng điểm khối sức khoẻ
              </h2>
            </div>
            <Link
              href="/nganh-dao-tao"
              className="text-sm font-semibold text-brand-700 hover:text-accent-600"
            >
              Xem tất cả →
            </Link>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPrograms.map((p, i) => (
              <ProgramCard key={p.slug} program={p} gradientClass={programGradient(i)} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="bg-paper px-6 py-24 sm:px-8">
        <Reveal className="mx-auto max-w-[1100px]">
          <SectionHeading eyebrow="Quy trình tuyển sinh" title="4 bước xét tuyển đơn giản" />
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="pointer-events-none absolute left-[12%] right-[12%] top-[26px] hidden h-0.5 lg:block"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #0B6CB0 0 8px, transparent 8px 16px)",
              }}
            />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 90} className="relative text-center">
                <div className="relative z-10 mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-brand-700 bg-white font-mono text-[13px] font-semibold text-brand-700 shadow-sm2">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h4 className="font-display text-base font-semibold text-ink">{s.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============ THƯ VIỆN (BENTO) ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-24 sm:px-8">
        <ParallaxBlur
          speed={0.18}
          className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[300px] rounded-full bg-accent-500/25 blur-[50px]"
        />
        <Reveal className="relative mx-auto max-w-[1320px]">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-brand-100">
                Đời sống sinh viên
              </div>
              <h2 className="font-display text-[34px] font-semibold text-white">
                Khoảnh khắc tại Hợp Lực
              </h2>
            </div>
            <Link href="/thu-vien" className="text-sm font-bold text-white hover:text-brand-100">
              Xem thư viện →
            </Link>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 5 }, (_, i) => galleryItems[i]).map((item, i) => (
              <Reveal
                key={item?.id ?? i}
                delay={i * 90}
                className={cn(
                  "relative h-[160px] overflow-hidden rounded-[18px]",
                  i === 0 && "col-span-2 row-span-2 h-full",
                  i === 4 && "col-span-2"
                )}
              >
                {item ? (
                  <Image src={item.imageUrl} alt={item.caption} fill className="object-cover" />
                ) : (
                  <ImagePlaceholder
                    label={
                      ["Thực hành lâm sàng", "Phòng thí nghiệm", "Lễ tốt nghiệp", "Hoạt động ngoại khoá", "Khuôn viên trường"][i]
                    }
                  />
                )}
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ============ GIẢNG VIÊN ============ */}
      {facultyList.length > 0 && (
        <section className="px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Đội ngũ giảng viên"
                title="Giảng viên giàu kinh nghiệm lâm sàng"
                align="left"
                className="mb-0"
              />
              <Link
                href="/doi-ngu-giang-vien"
                className="text-sm font-semibold text-brand-700 hover:text-accent-600"
              >
                Xem tất cả đội ngũ →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {facultyList.slice(0, 4).map((f, i) => {
                const card = (
                  <>
                    <div className="relative h-[200px]">
                      {f.photoUrl ? (
                        <Image
                          src={f.photoUrl}
                          alt={facultyDisplayName(f)}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ImagePlaceholder label="Ảnh chân dung" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-display text-base font-semibold text-ink">
                        {facultyDisplayName(f)}
                      </h4>
                      <div className="mt-0.5 text-[12.5px] text-brand-700">{f.role}</div>
                    </div>
                  </>
                );
                const className =
                  "block overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1";
                return (
                  <Reveal key={f.id} delay={i * 90}>
                    {f.slug ? (
                      <Link href={`/doi-ngu-giang-vien/${f.slug}`} className={className}>
                        {card}
                      </Link>
                    ) : (
                      <div className={className}>{card}</div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ ĐÁNH GIÁ CỰU SV ============ */}
      {testimonials.length > 0 && (
        <section className="bg-paper-alt px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1000px] text-center">
            <SectionHeading eyebrow="Cựu sinh viên nói gì" title="Câu chuyện thành công" />
            <div className="grid gap-6 text-left sm:grid-cols-2">
              {testimonials.map((t, i) => (
                <Reveal
                  key={t.id}
                  delay={i * 90}
                  className="rounded-[22px] border border-line bg-white p-8 shadow-md2"
                >
                  <p className="font-display text-[17px] italic leading-relaxed text-ink">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-100">
                      {t.avatarUrl && (
                        <Image src={t.avatarUrl} alt={t.name} fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-ink">{t.name}</div>
                      <div className="text-[12.5px] text-ink-soft">{t.role}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ SỰ KIỆN SẮP DIỄN RA ============ */}
      {nextEvents.length > 0 && (
        <section className="bg-paper-alt px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1320px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-[34px] font-semibold text-brand-900">
                Sự kiện sắp diễn ra
              </h2>
              <Link
                href="/su-kien"
                className="text-sm font-bold text-brand-700 hover:text-accent-600"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {nextEvents.map((e, i) => {
                const card = (
                  <>
                    <div className="relative h-[150px]">
                      {e.coverImageUrl ? (
                        <Image src={e.coverImageUrl} alt={e.title} fill className="object-cover" />
                      ) : (
                        <ImagePlaceholder label="Ảnh sự kiện" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-accent-600">
                        {formatVNDateTime(e.startAt)}
                        {e.location ? ` · ${e.location}` : ""}
                      </div>
                      <h4 className="font-display text-[17px] font-semibold leading-snug text-ink">
                        {e.title}
                      </h4>
                    </div>
                  </>
                );
                const className =
                  "block overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1";
                return (
                  <Reveal key={e.id} delay={i * 90}>
                    {e.slug ? (
                      <Link href={`/su-kien/${e.slug}`} className={className}>
                        {card}
                      </Link>
                    ) : (
                      <div className={className}>{card}</div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ TIN TỨC ============ */}
      {latestPosts.length > 0 && (
        <section className="px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1320px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-[34px] font-semibold text-brand-900">
                Tin tức
              </h2>
              <Link
                href="/tin-tuc"
                className="text-sm font-bold text-brand-700 hover:text-accent-600"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {latestPosts.map((n, i) => (
                <Reveal key={n.id} delay={i * 90}>
                  <Link
                    href={`/tin-tuc/${n.slug}`}
                    className="block overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-transform hover:-translate-y-1.5"
                  >
                    <div className="relative h-[170px]">
                      {n.coverImageUrl ? (
                        <Image src={n.coverImageUrl} alt={n.title} fill className="object-cover" />
                      ) : (
                        <ImagePlaceholder label="Ảnh bài viết" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                        {formatVNDate(n.publishedAt)}
                        {n.categoryName ? ` · ${n.categoryName}` : ""}
                      </div>
                      <h4 className="font-display text-[17px] font-semibold leading-snug text-ink">
                        {n.title}
                      </h4>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ BANNER CÔNG KHAI ============ */}
      <section className="px-6 pb-2 sm:px-8">
        <Reveal className="mx-auto max-w-[1320px]">
        <Link
          href="/cong-khai"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-7 py-5 shadow-sm2 transition-colors hover:border-brand-500"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-bold text-ink">Công khai theo quy định</div>
              <div className="text-[12.5px] text-ink-faint">
                Tài chính, cơ sở vật chất, chương trình đào tạo, đội ngũ giảng viên
              </div>
            </div>
          </div>
          <span className="text-sm font-semibold text-brand-700">Xem chi tiết →</span>
        </Link>
        </Reveal>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="px-6 pb-24 sm:px-8">
        <Reveal className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[32px] bg-gradient-to-br from-accent-600 to-accent-500 px-8 py-16 text-center sm:px-14">
          <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-white/10" />
          <h2 className="relative mx-auto max-w-xl font-display text-[32px] font-semibold leading-snug text-white">
            {content.ctaTitle}
          </h2>
          <p className="relative mx-auto mt-3.5 max-w-md text-[15px] text-white/90">
            {content.ctaDescription}
          </p>
          <Link
            href="/tuyen-sinh"
            className="relative mt-8 inline-block rounded-xl bg-white px-8 py-4 text-[15px] font-bold text-accent-600 shadow-lg2"
          >
            Đăng ký xét tuyển ngay
          </Link>
        </Reveal>
      </section>
    </>
  );
}
