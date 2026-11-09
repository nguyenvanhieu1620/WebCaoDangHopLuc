import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { HeroBanner, type HeroSlide } from "@/components/site/HeroBanner";
import { Reveal } from "@/components/site/Reveal";
import { ParallaxBlur } from "@/components/site/ParallaxBlur";
import { ProgramCard } from "@/components/site/ProgramCard";
import { CountUp } from "@/components/site/CountUp";
import { DnaScene3D } from "@/components/site/DnaScene3D";
import { TiltCard } from "@/components/site/TiltCard";
import { TestimonialSlider } from "@/components/site/TestimonialSlider";
import { EdgeSlider } from "@/components/site/EdgeSlider";
import { LightboxGroup, LightboxTrigger, type LightboxItem } from "@/components/site/Lightbox";
import { MoreLink } from "@/components/ui/MoreLink";
import { programGradient } from "@/lib/constants";
import { getPrograms } from "@/lib/data/programs";
import { getHomepageContent } from "@/lib/data/homepage";
import { getPartners } from "@/lib/data/partners";
import { getGalleryItems } from "@/lib/data/gallery";
import { GalleryMedia } from "@/components/site/GalleryMedia";
import { getFacultyList, facultyDisplayName } from "@/lib/data/faculty";
import { getDepartments } from "@/lib/data/departments";
import { degreeLevel } from "@/lib/faculty-directory";
import { FacultyCard, FacultySpotlight, type FacultyCardData } from "@/components/site/FacultyCard";
import type { Faculty } from "@/lib/db/schema";
import { getTestimonials } from "@/lib/data/testimonials";
import { getLatestPublishedPosts, getPinnedPosts } from "@/lib/data/posts";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getHeroBanners } from "@/lib/data/hero-banners";
import { getEvents } from "@/lib/data/events";
import { cn } from "@/lib/utils";
import { getLocale } from "@/lib/locale";
import { siteCopy, siteDayMonth, formatSiteDate, programCountLabel, admissionStepsLabel } from "@/lib/site-copy";
import type { Event } from "@/lib/db/schema";
import { FitImage } from "@/components/ui/FitImage";

/** Lọc + cắt 3 sự kiện sắp diễn ra — hàm thường (không phải component) nên gọi Date.now() ở đây được. */
function upcomingEvents(allEvents: Event[]): Event[] {
  const now = Date.now();
  return allEvents.filter((e) => new Date(e.startAt).getTime() >= now).slice(0, 3);
}

/** Thẻ kính tối hiển thị 1 chỉ số trong khối 3D "Vì sao chọn Hợp Lực" (VD "8.500+ Sinh viên đã tốt nghiệp"). */
function DarkStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    // Không dùng backdrop-blur: thẻ nằm trên nền xanh trơn (không còn đè lên mô hình 3D), mờ hay không
    // trông như nhau, mà kính mờ lại tốn GPU khi cuộn. `h-full` để 4 thẻ cùng hàng cao bằng nhau.
    <div className="h-full rounded-2xl border border-white/15 bg-white/[0.07] px-3 py-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] sm:px-5 lg:px-4">
      <div className={cn("font-mono text-[26px] font-semibold leading-none sm:text-[30px] lg:text-[26px]", accent ? "text-accent-400" : "text-white")}>
        <CountUp value={value} />
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-brand-100/75">{label}</div>
    </div>
  );
}

/**
 * Danh sách thẻ trên điện thoại: vuốt ngang (snap từng thẻ, thẻ sau lộ 1 phần
 * để gợi ý còn nữa) thay vì xếp dọc rất dài; từ `sm` trở lên trở lại lưới.
 * `-mx-6 px-6` để dải vuốt chạy sát mép màn hình nhưng thẻ đầu vẫn thẳng lề.
 */
const MOBILE_SWIPE_ROW =
  "no-scrollbar -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pb-3 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0";
const MOBILE_SWIPE_ITEM_NARROW = "w-[68%] shrink-0 snap-start sm:w-auto";

/**
 * Ảnh cho banner Trang chủ: ưu tiên banner CMS (admin/banner-trang-chu) →
 * ảnh Hero cũ (Nội dung Trang chủ) → ảnh minh hoạ 3D có sẵn (tạm thời, tới
 * khi trường tải ảnh thật — Dashboard admin có nhắc việc này).
 */
function heroSlides(
  banners: { id: string; imageUrl: string; caption: string | null; linkUrl: string | null; videoUrl: string | null }[],
  heroImageUrl: string | null
): HeroSlide[] {
  if (banners.length > 0)
    return banners.map(({ id, imageUrl, caption, linkUrl, videoUrl }) => ({ id, imageUrl, caption, linkUrl, videoUrl }));
  if (heroImageUrl) return [{ id: "hero-image", imageUrl: heroImageUrl, caption: null, linkUrl: null }];
  return [{ id: "fallback", imageUrl: "/images/3d/medical-learning.webp", caption: null, linkUrl: null }];
}

/** Icon cho 3 thẻ "Vì sao chọn Hợp Lực" (thực hành lâm sàng / đồng hành việc làm / giảng viên) — xoay vòng theo vị trí. */
const FEATURE_ICONS = [
  <svg key="clinic" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 3v6a6 6 0 0012 0V3M6 3H4m2 0h2m10 0h-2m2 0h2M12 15v2a4 4 0 008 0v-1" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="20" cy="14" r="2" />
  </svg>,
  <svg key="career" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" strokeLinecap="round" />
  </svg>,
  <svg key="mentor" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

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
    allPrograms,
    content,
    partners,
    galleryItems,
    facultyList,
    testimonials,
    latestPosts,
    pinnedPosts,
    settings,
    heroBanners,
    allEvents,
    departments,
    locale,
  ] = await Promise.all([
    getPrograms(),
    getHomepageContent(),
    getPartners(),
    getGalleryItems(),
    getFacultyList(),
    getTestimonials(),
    getLatestPublishedPosts(3),
    getPinnedPosts(5),
    getSiteSettings(),
    getHeroBanners(),
    getEvents(),
    getDepartments(),
    getLocale(),
  ]);
  const t = siteCopy(locale);
  const { stats, features, steps } = content;
  const missionBlocks = [
    { text: content.missionText, label: t.mission, tone: "blue" as const },
    { text: content.visionText, label: t.vision, tone: "red" as const },
  ].filter((b) => b.text);
  // Khối đội ngũ: người đầu danh sách (thứ tự trong admin/giang-vien) nổi bật, tối đa 3 người tiếp theo dạng thẻ.
  const facultyCard = (f: Faculty): FacultyCardData => ({
    href: f.slug ? `/doi-ngu-giang-vien/${f.slug}` : null,
    name: facultyDisplayName(f),
    role: f.role,
    department: departments.find((d) => d.id === f.departmentId)?.name ?? null,
    specialty: f.specialty,
    photoUrl: f.photoUrl,
  });
  const [featuredFaculty, ...otherFaculty] = facultyList.slice(0, 4);
  // Số liệu chỉ hiện khi đội ngũ đã nhập tương đối đủ — con số quá nhỏ (VD "4 giảng viên") phản tác dụng.
  const postgraduateCount = facultyList.filter((f) => ["tien-si", "ck2", "thac-si", "ck1"].includes(degreeLevel(f.degree)?.key ?? "")).length;
  const departmentCount = new Set(facultyList.map((f) => f.departmentId).filter(Boolean)).size;
  const facultyStats =
    facultyList.length >= 8
      ? [
          { value: String(facultyList.length), label: t.facultyStaff },
          ...(departmentCount > 1 ? [{ value: String(departmentCount), label: t.departments }] : []),
          ...(postgraduateCount > 0 ? [{ value: String(postgraduateCount), label: t.postgraduate }] : []),
        ]
      : [];
  const nextEvents = upcomingEvents(allEvents);
  // Dải đối tác chạy vô tận: lặp danh sách đủ dài (≥ 8 mục mỗi nửa) để lấp kín
  // màn hình rộng, rồi nhân đôi — CSS dịch -50% là khớp liền mạch.
  const marqueeBase = partners.length ? Array.from({ length: Math.ceil(8 / partners.length) }, () => partners).flat() : [];
  const marqueeItems = [...marqueeBase, ...marqueeBase];
  // 5 ô bento "Trải nghiệm Hợp Lực" — bấm mở lightbox; có video thì thêm nút "Xem video" mở thẳng mục đó.
  const galleryLightbox: LightboxItem[] = galleryItems
    .slice(0, 5)
    .map(({ id, imageUrl, caption, videoUrl }) => ({ id, imageUrl, caption, videoUrl }));
  const firstVideoIndex = galleryLightbox.findIndex((g) => g.videoUrl);

  const quickTools = [
    {
      href: "/tuyen-sinh",
      label: t.apply,
      desc: t.onlineApplication,
      icon: QUICK_TOOL_ICONS.admission,
      iconBg: "bg-brand-700/10 text-brand-700",
    },
    {
      href: "/tra-cuu-ket-qua",
      label: t.results,
      desc: t.admissionResults,
      icon: QUICK_TOOL_ICONS.lookup,
      iconBg: "bg-accent-600/10 text-accent-600",
    },
    {
      href: "/thu-vien",
      label: t.library,
      desc: t.libraryDescription,
      icon: QUICK_TOOL_ICONS.library,
      iconBg: "bg-brand-700/10 text-brand-700",
    },
    {
      href: settings.lmsUrl && settings.lmsUrl !== "#" ? settings.lmsUrl : "/lms",
      label: t.lms,
      desc: t.lmsDescription,
      icon: QUICK_TOOL_ICONS.lms,
      iconBg: "bg-accent-600/10 text-accent-600",
      external: !!settings.lmsUrl && settings.lmsUrl !== "#",
    },
  ];

  return (
    <>
      {/* ============ 1. BANNER (ảnh rõ 16:9, chữ bên dưới) + CÔNG CỤ NHANH ============
          Thứ tự các khối Trang chủ (xem CLAUDE.md mục 5 "Đợt VinUni lượt 2"):
          Banner → Vì sao chọn → Tin tức·Thông báo·Sự kiện → Ngành → Sứ mệnh → Giảng viên →
          Câu chuyện thành công → Trải nghiệm (thư viện) → Đối tác → Tuyển sinh (4 bước + CTA). */}
      <HeroBanner
        locale={locale}
        slides={heroSlides(heroBanners, content.heroImageUrl)}
        badge={content.heroBadge}
        titleLine1={content.heroTitleLine1}
        titleLine2={content.heroTitleLine2}
        description={content.heroDescription}
        stats={[
          { value: content.heroBadge1Value, label: content.heroBadge1Label },
          { value: content.heroBadge2Value, label: content.heroBadge2Label },
        ]}
      />

      {/* ============ CÔNG CỤ NHANH — thanh nổi ngay dưới dải chữ của banner ============ */}
      <section className="relative z-20 -mt-12 px-4 sm:px-8">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 overflow-hidden rounded-[22px] border border-white bg-white/95 shadow-[0_30px_70px_-30px_rgba(6,50,90,0.45)] backdrop-blur-xl lg:grid-cols-4">
          {quickTools.map((tool, i) => (
            <Link
              key={tool.href + tool.label}
              href={tool.href}
              target={"external" in tool && tool.external ? "_blank" : undefined}
              rel={"external" in tool && tool.external ? "noopener noreferrer" : undefined}
              className={cn(
                // Mobile: icon trên, chữ dưới (ô 2 cột hẹp — icon cạnh chữ làm nhãn Montserrat xuống 3 dòng).
                "group relative flex flex-col items-start gap-2.5 p-4 transition-colors hover:bg-brand-50 sm:flex-row sm:items-center sm:gap-3.5 sm:p-6",
                i % 2 === 1 && "border-l border-line",
                i >= 2 && "border-t border-line lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:-translate-y-0.5 sm:h-12 sm:w-12", tool.iconBg)}>
                {tool.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-ink group-hover:text-brand-700 sm:text-[14.5px]">{tool.label}</div>
                <div className="hidden truncate text-[12px] text-ink-faint sm:block">{tool.desc}</div>
              </div>
              <span className="hidden text-brand-700 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 lg:block">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ 2. VÌ SAO CHỌN HỢP LỰC — khối 3D nền tối ============
          Cảnh DNA 3D đặt ở đây (không phải banner): theo các mẫu web đoạt giải,
          3D dùng để tạo không khí cho 1 khối kể chuyện giữa trang, còn banner
          đầu trang dành cho ảnh thật của trường. Từng phần hiện lệch nhịp
          (nhãn → tiêu đề → từng điểm mạnh) kiểu WOW fadeInUp của VinUni. */}
      <section className="relative isolate mt-16 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 px-6 py-20 text-white sm:px-8 sm:py-24">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
        <ParallaxBlur
          speed={0.08}
          className="pointer-events-none absolute -left-40 top-10 h-[440px] w-[440px] rounded-full bg-brand-500/10 blur-[90px]"
        />
        <ParallaxBlur
          speed={-0.08}
          className="pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full bg-accent-500/5 blur-[90px]"
        />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start xl:gap-16">
          <div className="min-w-0 lg:pt-6">
            <Reveal>
              <Eyebrow tone="onDark">{t.why}</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-5 max-w-[640px] text-balance font-display text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[48px] lg:text-left">
                {t.whyTitle}{" "}
                <em className="font-medium italic text-accent-400 lg:whitespace-nowrap">{t.whyEmphasis}</em>{" "}{t.whyEnding}
              </h2>
            </Reveal>
            <ol className="mt-11 space-y-8">
              {features.map((f, i) => (
                <li key={f.title}>
                  <Reveal delay={180 + i * 90} className="group flex gap-4 sm:gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-accent-400 backdrop-blur transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent-500 group-hover:bg-accent-600 group-hover:text-white">
                      {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] tracking-wider text-brand-200/60">{String(i + 1).padStart(2, "0")}</div>
                      <h3 className="font-display text-[20px] font-semibold">{f.title}</h3>
                      <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-brand-100/75">{f.desc}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          <div className="min-w-0">
            {/* Cảnh nằm trọn trong cột riêng, chừa khoảng cách với phần chữ và hàng số liệu. */}
            <div className="relative h-[360px] sm:h-[440px] lg:h-[460px] xl:h-[480px]">
              <DnaScene3D theme="dark" className="absolute inset-0" />
            </div>
            <div className="mb-6 hidden items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider text-brand-100/60 lg:flex">
              <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-accent-500" />
              {t.rotateModel}
            </div>
            {/* Bốn chỉ số nằm dưới mô hình; dùng lưới 2×2 đến khi cột đủ rộng từ xl. */}
            <div className="mt-2 grid grid-cols-2 gap-3 lg:mt-0 xl:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  <DarkStat value={s.value} label={s.label} accent={i % 3 !== 0} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3. TIN TỨC · THÔNG BÁO · SỰ KIỆN — đưa lên cao như VinUni ============
          Trái: 1 tin nổi bật lớn + 2 tin nhỏ (kiểu tạp chí). Phải: bảng "Thông báo"
          (bài được ghim) + "Sự kiện sắp diễn ra" — gộp 3 khối cũ thành 1 cho trang gọn. */}
      {(latestPosts.length > 0 || pinnedPosts.length > 0 || nextEvents.length > 0) && (
        <section className="bg-paper px-6 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow={t.news} title={t.newsTitle} align="left" className="mb-0" />
              <Reveal delay={180}>
                <MoreLink href="/tin-tuc">{t.allNews}</MoreLink>
              </Reveal>
            </div>
            <div className={cn("grid gap-6 xl:gap-8", latestPosts.length > 0 && (pinnedPosts.length > 0 || nextEvents.length > 0) && "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]")}>
              {latestPosts.length > 0 && (
                <div className="grid min-w-0 gap-5 md:grid-cols-2 md:gap-6">
                  {latestPosts.map((n, i) => {
                    const featured = i === 0;
                    // Chỉ có 1 tin nhỏ (tổng 2 bài) thì cho trải hết hàng, tránh trống nửa bên phải.
                    const fullRow = featured || latestPosts.length === 2;
                    // Tin nổi bật kiểu VinUni: ảnh phủ kín, chữ trắng đè trên lớp tối phía dưới.
                    if (featured) {
                      return (
                        <Reveal key={n.id} className="md:col-span-2">
                          <Link
                            href={`/tin-tuc/${n.slug}`}
                            className="group relative isolate flex min-h-[400px] flex-col justify-end overflow-hidden rounded-[24px] bg-brand-900 shadow-md2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 sm:min-h-[440px] lg:min-h-[460px]"
                          >
                            <div className="absolute inset-0 overflow-hidden">
                              {n.coverImageUrl ? (
                                <FitImage
                                  src={n.coverImageUrl}
                                  alt={n.title}
                                  sizes="(max-width: 1023px) 100vw, (max-width: 1279px) calc(100vw - 428px), 908px"
                                  textBelow
                                  className="transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-visible:scale-[1.035] motion-reduce:transition-none"
                                />
                              ) : (
                                <ImagePlaceholder label={t.postImage} />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/55 to-brand-900/5" />
                            <div className="relative p-5 text-white sm:p-8">
                              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="max-w-full break-words rounded-md bg-accent-600 px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                                  {n.categoryName ?? t.featuredNews}
                                </span>
                                <span className="whitespace-nowrap font-mono text-[11px] text-white/85">{formatSiteDate(n.publishedAt, locale)}</span>
                              </div>
                              <h3 className="max-w-3xl text-pretty font-display text-[24px] font-semibold leading-[1.25] tracking-tight sm:text-[30px] lg:text-[32px]">{n.title}</h3>
                              {n.excerpt && <p className="mt-3 line-clamp-2 max-w-2xl text-[14px] leading-relaxed text-white/85 sm:text-[14.5px]">{n.excerpt}</p>}
                              <span className="mt-6 inline-flex items-center gap-3 text-[13px] font-semibold">
                                <span className="link-underline">{t.readMore}</span>
                                <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1 motion-reduce:transition-none">→</span>
                              </span>
                            </div>
                          </Link>
                        </Reveal>
                      );
                    }
                    return (
                      <Reveal key={n.id} delay={i * 90} className={cn(fullRow && "md:col-span-2")}>
                        {/* Mobile: hàng ngang gọn (ảnh nhỏ trái, chữ phải) cho khối tin không dài lê thê; từ md: thẻ ảnh lớn. */}
                        <Link
                          href={`/tin-tuc/${n.slug}`}
                          className="group flex h-full min-w-0 gap-4 overflow-hidden rounded-[22px] border border-line bg-white p-3 shadow-sm2 transition-shadow duration-300 hover:shadow-md2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 motion-reduce:transition-none md:flex-col md:gap-0 md:p-0"
                        >
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:w-28 md:aspect-[16/10] md:h-auto md:w-full md:rounded-none">
                            {n.coverImageUrl ? (
                              <FitImage
                                src={n.coverImageUrl}
                                alt={n.title}
                                sizes="(max-width: 639px) 96px, (max-width: 767px) 112px, (max-width: 1023px) 50vw, 450px"
                                className="transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035] motion-safe:group-focus-visible:scale-[1.035] motion-reduce:transition-none"
                              />
                            ) : (
                              <ImagePlaceholder label={t.postImage} />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col py-1 md:p-5 xl:p-6">
                            {/* Nhãn chuyên mục đỏ in hoa kiểu VinUni */}
                            <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              {n.categoryName && (
                                <span className="max-w-full break-words font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-accent-600">
                                  {n.categoryName}
                                </span>
                              )}
                              <span className="whitespace-nowrap font-mono text-[11px] text-ink-muted">{formatSiteDate(n.publishedAt, locale)}</span>
                            </div>
                            <h3 className="line-clamp-3 font-display text-[15px] font-semibold leading-[1.4] text-ink transition-colors group-hover:text-brand-700 group-focus-visible:text-brand-700 md:text-[18px]">
                              {n.title}
                            </h3>
                            <span aria-hidden="true" className="mt-auto hidden items-center gap-2 pt-5 text-[12px] font-semibold text-brand-700 md:inline-flex">
                              {t.readMore} <span className="transition-transform duration-300 motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1 motion-reduce:transition-none">→</span>
                            </span>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              {(pinnedPosts.length > 0 || nextEvents.length > 0) && (
                // Giới hạn chiều rộng cột để tiêu đề, giờ và địa điểm xuống dòng trong đúng khung.
                <div className={cn("grid h-fit min-w-0 grid-cols-[minmax(0,1fr)] gap-6", latestPosts.length === 0 && "md:grid-cols-2")}>
                  {pinnedPosts.length > 0 && (
                    <Reveal delay={120}>
                      <aside className="overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2" aria-label={t.notices}>
                        <div className="flex items-center gap-3 bg-gradient-to-r from-accent-600 to-accent-500 px-5 py-4 text-white sm:px-6">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M12 2a5 5 0 00-5 5v3.6c0 .5-.2 1-.6 1.4L5 13.4c-.6.6-.2 1.6.6 1.6h13a1 1 0 00.7-1.6l-1.4-1.4a2 2 0 01-.6-1.4V7a5 5 0 00-5-5z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 18a3 3 0 006 0" strokeLinecap="round" />
                          </svg>
                          <span className="font-display text-[18px] font-semibold">{t.notices}</span>
                        </div>
                        <ul className="divide-y divide-line">
                          {pinnedPosts.map((p) => {
                            const date = siteDayMonth(p.publishedAt, locale);
                            return (
                              <li key={p.id}>
                                <Link href={`/tin-tuc/${p.slug}`} className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 sm:px-6">
                                  {date && (
                                    <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-paper text-center">
                                      <span className="font-display text-[20px] font-bold leading-none text-brand-900">{date.day}</span>
                                      <span className="mt-1 font-mono text-[9.5px] uppercase text-ink-faint">{date.month}</span>
                                    </span>
                                  )}
                                  <span className="min-w-0 text-[14px] font-semibold leading-relaxed text-ink group-hover:text-brand-700 group-focus-visible:text-brand-700">
                                    {p.title}
                                    {p.attachmentUrl && (
                                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 align-middle text-[10.5px] font-semibold text-brand-700">
                                        📎 {t.attachment}
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </aside>
                    </Reveal>
                  )}

                  {nextEvents.length > 0 && (
                    <Reveal delay={200}>
                      <aside className="overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2" aria-label={t.upcomingEvents}>
                        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-900 to-brand-700 px-5 py-4 text-white sm:px-6">
                          <span className="flex min-w-0 items-center gap-3">
                            <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <rect x="3" y="5" width="18" height="16" rx="2" />
                              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
                            </svg>
                            <span className="font-display text-[16px] font-semibold leading-snug sm:text-[18px]">{t.upcomingEvents}</span>
                          </span>
                          <Link href="/su-kien" className="shrink-0 py-2 text-[12px] font-semibold text-brand-100 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                            {t.calendar} →
                          </Link>
                        </div>
                        <ul className="divide-y divide-line">
                          {nextEvents.map((e) => {
                            const date = siteDayMonth(e.startAt, locale);
                            const body = (
                              <>
                                {date && (
                                  <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 text-center text-white shadow-sm2">
                                    <span className="font-display text-[20px] font-bold leading-none">{date.day}</span>
                                    <span className="mt-1 font-mono text-[9.5px] uppercase text-brand-100">{date.month}</span>
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="line-clamp-2 text-[14px] font-semibold leading-relaxed text-ink group-hover:text-brand-700 group-focus-visible:text-brand-700">{e.title}</span>
                                  <span className="mt-2 block font-mono text-[11px] font-medium leading-relaxed text-accent-600">
                                    {formatSiteDate(e.startAt, locale, true)}
                                  </span>
                                  {e.location && <span className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{e.location}</span>}
                                </span>
                              </>
                            );
                            return (
                              <li key={e.id}>
                                {e.slug ? (
                                  <Link href={`/su-kien/${e.slug}`} className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 sm:px-6">
                                    {body}
                                  </Link>
                                ) : (
                                  <div className="flex items-start gap-4 px-5 py-5 sm:px-6">{body}</div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </aside>
                    </Reveal>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ 4. NGÀNH ĐÀO TẠO — slider thẻ màu gọn trong khung 1320px (3 thẻ/màn hình máy tính) ============ */}
      {allPrograms.length > 0 && (
        <section className="overflow-hidden bg-paper-alt py-24">
          <div className="mx-auto mb-10 flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-6 sm:px-8">
            <SectionHeading
              eyebrow={t.programs}
              title={programCountLabel(allPrograms.length, locale)}
              description={t.programsDescription}
              align="left"
              className="mb-0"
            />
            <Reveal delay={180}>
              <MoreLink href="/nganh-dao-tao">{t.allPrograms}</MoreLink>
            </Reveal>
          </div>
          <EdgeSlider locale={locale} label={t.programList} itemClassName="min-h-[340px] w-[85%] sm:min-h-[360px] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
            {allPrograms.map((p, i) => (
              <ProgramCard key={p.slug} locale={locale} program={p} gradientClass={programGradient(i)} delay={Math.min(i, 3) * 80} />
            ))}
          </EdgeSlider>
        </section>
      )}

      {/* ============ 5. SỨ MỆNH - TẦM NHÌN ============
          Trên PC hai thẻ cùng chiều cao, nhãn và nội dung thẳng hàng; chỉ một thẻ thì căn giữa.
          Giữ hai cột từ lg để đoạn văn có đủ bề ngang trên tablet. */}
      {missionBlocks.length > 0 && (
        <section className="px-6 py-20 sm:px-8 sm:py-24">
          <div className={cn("mx-auto grid gap-6 xl:gap-8", missionBlocks.length > 1 ? "max-w-[1320px] lg:grid-cols-2" : "max-w-3xl")}>
            {missionBlocks.map((b, i) => (
              <Reveal key={b.label} delay={i * 120} className="h-full">
                <TiltCard
                  max={1.5}
                  className={cn(
                    "flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-white px-6 py-8 shadow-sm2 hover:shadow-md2 sm:px-10 sm:py-10 xl:px-12 xl:py-12",
                    b.tone === "red" ? "hover:border-accent-200" : "hover:border-brand-200"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r",
                      b.tone === "red" ? "from-accent-600 to-accent-500" : "from-brand-700 to-brand-500"
                    )}
                  />
                  <div className="relative mb-6 flex min-h-10 items-center justify-between gap-4">
                    <h2>
                      <Eyebrow tone={b.tone} className="text-[12px] font-bold tracking-[0.1em]">
                        {b.label}
                      </Eyebrow>
                    </h2>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none h-10 shrink-0 select-none font-display text-[80px] font-medium leading-none sm:text-[88px]",
                        b.tone === "red" ? "text-accent-500/20" : "text-brand-500/20"
                      )}
                    >
                      “
                    </span>
                  </div>
                  <p className="relative text-pretty font-display text-[18px] leading-[1.7] text-brand-900 sm:text-[20px]">{b.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ 6. ĐỘI NGŨ GIẢNG VIÊN — khối nền xanh đậm ============
          Lưới 2 cột (từ xl — 1024px thì 3 thẻ bên phải chỉ rộng ~160px): trái = chân dung lớn người đầu danh sách (cao 2 hàng), phải = tiêu đề + số liệu (hàng 1)
          và tối đa 3 thẻ trong mờ (hàng 2). Điện thoại theo thứ tự DOM: tiêu đề → người nổi bật → dải vuốt ngang. */}
      {featuredFaculty && (
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 px-6 py-20 text-white sm:px-8 sm:py-24 lg:py-28">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" />
          <ParallaxBlur
            speed={0.06}
            className="pointer-events-none absolute -left-32 top-1/4 h-[440px] w-[440px] rounded-full bg-brand-500/10 blur-[90px]"
          />
          <ParallaxBlur
            speed={-0.06}
            className="pointer-events-none absolute -bottom-10 -right-24 h-[380px] w-[380px] rounded-full bg-accent-500/5 blur-[90px]"
          />
          <div className="relative mx-auto grid max-w-[1320px] gap-10 sm:gap-y-12 xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] xl:gap-x-14 xl:gap-y-8">
            <div className="xl:col-start-2 xl:row-start-1">
              <div className="flex flex-col items-start gap-5 sm:gap-6">
                <SectionHeading
                  onDark
                  eyebrowTone="onDark"
                  eyebrow={t.faculty}
                  title={t.facultyTitle}
                  align="left"
                  className="mb-0"
                />
                <Reveal delay={180}>
                  <MoreLink href="/doi-ngu-giang-vien" onDark>
                    {t.allFaculty}
                  </MoreLink>
                </Reveal>
              </div>
              {facultyStats.length > 0 && (
                <Reveal delay={240}>
                  <dl
                    className={cn(
                      "mt-9 grid divide-x divide-white/10 border-y border-white/10",
                      facultyStats.length === 3 ? "grid-cols-3" : facultyStats.length === 2 ? "grid-cols-2" : "grid-cols-1"
                    )}
                  >
                    {facultyStats.map((st) => (
                      <div key={st.label} className="flex flex-col-reverse px-4 py-5 first:pl-0">
                        <dt className="mt-2 text-[11.5px] uppercase tracking-wider text-brand-200">{st.label}</dt>
                        <dd className="font-mono text-[30px] font-semibold leading-none text-white sm:text-[36px]">
                          <CountUp value={st.value} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              )}
            </div>
            <Reveal className="xl:col-start-1 xl:row-span-2 xl:row-start-1 xl:self-end">
              <FacultySpotlight locale={locale} data={facultyCard(featuredFaculty)} />
            </Reveal>
            {otherFaculty.length > 0 && (
              <div className={cn(MOBILE_SWIPE_ROW, "sm:grid-cols-3 sm:gap-5 xl:col-start-2 xl:row-start-2")}>
                {otherFaculty.map((f, i) => (
                  <FacultyCard
                    locale={locale}
                    key={f.id}
                    tone="glass"
                    delay={i * 90}
                    className={MOBILE_SWIPE_ITEM_NARROW}
                    sizes="(max-width: 640px) 68vw, 260px"
                    data={facultyCard(f)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ 7. CÂU CHUYỆN THÀNH CÔNG (cựu SV) ============ */}
      {testimonials.length > 0 && (
        <TestimonialSlider
          locale={locale}
          items={testimonials.map(({ id, quote, name, role, avatarUrl }) => ({ id, quote, name, role, avatarUrl }))}
        />
      )}

      {/* ============ 8. TRẢI NGHIỆM HỢP LỰC — thư viện ảnh/video, xem ngay trên trang ============
          Kiểu "EXPERIENCE VINUNI": bấm ô ảnh mở lightbox, có video thì hiện nút phát nổi bật. */}
      <section className="relative overflow-clip bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-24 sm:px-8">
        <ParallaxBlur
          speed={0.18}
          className="pointer-events-none absolute left-[10%] top-[20%] h-[300px] w-[300px] rounded-full bg-accent-500/25 blur-[50px]"
        />
        <LightboxGroup locale={locale} items={galleryLightbox}>
          <div className="relative mx-auto max-w-[1320px]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow={t.studentLife}
                eyebrowTone="onDark"
                title={t.experience}
                align="left"
                onDark
                className="mb-0"
              />
              <Reveal delay={180} className="flex flex-wrap items-center gap-6">
                {firstVideoIndex >= 0 && (
                  <LightboxTrigger
                    index={firstVideoIndex}
                    label={t.viewVideo}
                    className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-[13.5px] font-bold text-brand-900 shadow-lg2 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-600 to-accent-500 text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                    {t.viewVideo}
                  </LightboxTrigger>
                )}
                <MoreLink href="/thu-vien" onDark>
                  {t.viewLibrary}
                </MoreLink>
              </Reveal>
            </div>
            {/* Chiều cao đặt qua grid-rows (không trộn h-[160px] với h-full trên cùng phần tử —
                `cn()` không gộp class, 2 class cùng thuộc tính sẽ không rõ class nào thắng,
                từng làm ô lớn đầu tiên co thành vạch mỏng trên mobile). */}
            <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4 sm:gap-4">
              {Array.from({ length: 5 }, (_, i) => galleryLightbox[i]).map((item, i) => (
                <Reveal
                  key={item?.id ?? i}
                  delay={i * 90}
                  className={cn(
                    "relative overflow-clip rounded-[18px]",
                    // Ô 0 lớn 2×2, 4 ô còn lại lấp kín 2 cột bên phải (desktop) / 2 hàng dưới (mobile).
                    i === 0 && "col-span-2 row-span-2"
                  )}
                >
                  {item ? (
                    <LightboxTrigger index={i} label={`${item.videoUrl ? t.viewVideo : t.viewImage}: ${item.caption}`} className="relative block h-full w-full cursor-zoom-in">
                      <GalleryMedia
                        item={item}
                        className="img-reveal img-shine h-full w-full"
                        sizes={i === 0 ? "(max-width: 640px) 100vw, 640px" : "(max-width: 640px) 50vw, 320px"}
                      />
                      {item.caption && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-brand-900/85 to-transparent px-4 pb-3 pt-10 text-[12.5px] font-semibold text-white sm:text-[13.5px]">
                          <span className="line-clamp-1">{item.caption}</span>
                        </span>
                      )}
                    </LightboxTrigger>
                  ) : (
                    <ImagePlaceholder
                      label={
                        [t.clinicalPractice, t.laboratory, t.graduation, t.extracurricular, t.campus][i]
                      }
                    />
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </LightboxGroup>
      </section>

      {/* ============ 9. ĐỐI TÁC — dải logo chạy ngang (VinUni đặt đối tác gần cuối trang) ============ */}
      {partners.length > 0 && (
        <section className="py-20" aria-label={t.trainingPartners}>
          <div className="px-6 sm:px-8">
            <SectionHeading eyebrow={t.partners} title={t.partnersTitle} className="mb-10" />
          </div>
          <div className="marquee overflow-hidden">
            <div className="marquee-track flex w-max items-center">
              {marqueeItems.map((p, i) => {
                // Chỉ lượt đầu của danh sách gốc là "thật" — mọi bản lặp (đệm cho đủ dài + nửa sau để
                // chạy vòng) ẩn với trình đọc màn hình, không nhận focus, và ẩn hẳn khi giảm chuyển động.
                const duplicate = i >= partners.length;
                const itemClass = cn(
                  "group/partner mr-4 flex h-16 items-center gap-3 whitespace-nowrap rounded-2xl border border-line bg-white px-6 font-display text-[16px] font-semibold text-brand-900 shadow-sm2 transition-all hover:border-brand-200 hover:shadow-md2",
                  duplicate && "marquee-dup"
                );
                // Có logo: hiện logo (xám, rê chuột hiện màu thật); chưa có: tên chữ như cũ.
                const inner = p.logoUrl ? (
                  <span className="relative block h-9 w-[132px]">
                    <Image
                      src={p.logoUrl}
                      alt={p.name}
                      fill
                      sizes="132px"
                      className="object-contain opacity-70 grayscale transition-all duration-300 group-hover/partner:opacity-100 group-hover/partner:grayscale-0"
                    />
                  </span>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-accent-600 to-accent-500" />
                    {p.name}
                  </>
                );
                return p.websiteUrl ? (
                  <a
                    key={`${p.id}-${i}`}
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={p.name}
                    aria-hidden={duplicate || undefined}
                    tabIndex={duplicate ? -1 : undefined}
                    className={itemClass}
                  >
                    {inner}
                  </a>
                ) : (
                  <span key={`${p.id}-${i}`} title={p.name} aria-hidden={duplicate || undefined} className={itemClass}>
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ 10. TUYỂN SINH — gộp "4 bước xét tuyển" + CTA + link Công khai ============ */}
      <section className="px-6 pb-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-accent-600 to-accent-500 text-white shadow-red">
            <div className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-32 left-[30%] h-80 w-80 rounded-full bg-white/[0.06]" />
            <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14 lg:p-16">
              <div>
                <Reveal>
                  <Eyebrow tone="onDark">{t.admissions}</Eyebrow>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="mt-5 text-balance font-display text-[32px] font-semibold leading-[1.1] tracking-tight sm:text-[42px]">
                    {content.ctaTitle}
                  </h2>
                </Reveal>
                <Reveal delay={180}>
                  <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/90">{content.ctaDescription}</p>
                </Reveal>
                <Reveal delay={260} className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/tuyen-sinh#dang-ky"
                    className="whitespace-nowrap rounded-xl bg-white px-5 py-4 text-[14px] font-bold text-accent-600 shadow-lg2 transition-transform hover:-translate-y-0.5 sm:px-7 sm:text-[15px]"
                  >
                    {t.applyNow}
                  </Link>
                  <Link
                    href="/tra-cuu-ket-qua"
                    className="whitespace-nowrap rounded-xl border border-white/45 px-5 py-4 text-[14px] font-bold text-white transition-colors hover:bg-white/10 sm:px-7 sm:text-[15px]"
                  >
                    {t.results}
                  </Link>
                </Reveal>
              </div>
              <div>
                <Reveal className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">
                  {admissionStepsLabel(steps.length, locale)}
                </Reveal>
                <ol className="space-y-3">
                  {steps.map((s, i) => (
                    <li key={s.title}>
                      <Reveal delay={i * 90} className="flex gap-4 rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[13px] font-semibold text-accent-600 shadow-sm2">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="block font-display text-[17px] font-semibold">{s.title}</span>
                          <span className="mt-1 block text-[13.5px] leading-relaxed text-white/85">{s.desc}</span>
                        </span>
                      </Reveal>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <Reveal className="mt-5">
            <Link
              href="/cong-khai"
              className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-7 py-5 shadow-sm2 transition-colors hover:border-brand-500"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 12l2 2 4-4M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[14px] font-bold text-ink">{t.disclosures}</div>
                  <div className="text-[12.5px] text-ink-faint">{t.disclosuresDescription}</div>
                </div>
              </div>
              <span className="text-sm font-semibold text-brand-700">
                <span className="link-underline">{t.viewDetails}</span> →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
