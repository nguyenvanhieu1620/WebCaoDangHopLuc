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
import { getTestimonials } from "@/lib/data/testimonials";
import { getLatestPublishedPosts, getPinnedPosts } from "@/lib/data/posts";
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

/** Thẻ kính tối hiển thị 1 chỉ số trong khối 3D "Vì sao chọn Hợp Lực" (VD "8.500+ Sinh viên đã tốt nghiệp"). */
function DarkStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className={cn("font-mono text-[30px] font-semibold leading-none", accent ? "text-accent-400" : "text-white")}>
        <CountUp value={value} />
      </div>
      <div className="mt-1.5 text-[12.5px] leading-snug text-brand-100/75">{label}</div>
    </div>
  );
}

/** Ngày/tháng theo giờ Việt Nam cho ô lịch nhỏ ở bảng Thông báo, VD { day: "05", month: "Th10" }. */
function vnDayMonth(iso: string | null): { day: string; month: string } | null {
  if (!iso) return null;
  const parts = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return day && month ? { day, month: `Th${month}` } : null;
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
  banners: { id: string; imageUrl: string; caption: string | null; linkUrl: string | null }[],
  heroImageUrl: string | null
): HeroSlide[] {
  if (banners.length > 0) return banners.map(({ id, imageUrl, caption, linkUrl }) => ({ id, imageUrl, caption, linkUrl }));
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
  ]);
  const { stats, features, steps } = content;
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
      href: settings.lmsUrl && settings.lmsUrl !== "#" ? settings.lmsUrl : "/lms",
      label: "Cổng học tập LMS",
      desc: "Học liệu điện tử VNPT",
      icon: QUICK_TOOL_ICONS.lms,
      iconBg: "bg-accent-600/10 text-accent-600",
      external: !!settings.lmsUrl && settings.lmsUrl !== "#",
    },
  ];

  return (
    <>
      {/* ============ 1. BANNER (tràn toàn màn hình) + CÔNG CỤ NHANH ============
          Thứ tự 10 khối Trang chủ (gọn theo kiểu VinUni, xem CLAUDE.md mục 5 "Đợt VinUni lượt 2"):
          Banner → Vì sao chọn → Tin tức·Thông báo·Sự kiện → Ngành → Sứ mệnh → Giảng viên →
          Câu chuyện thành công → Trải nghiệm (thư viện) → Đối tác → Tuyển sinh (4 bước + CTA). */}
      <HeroBanner
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

      {/* ============ CÔNG CỤ NHANH — thanh nổi đè lên mép dưới banner ============ */}
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
      <section className="relative isolate mt-16 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-900 to-brand-800 px-6 py-24 text-white sm:px-8 lg:py-28">
        <div className="bg-grid-dark pointer-events-none absolute inset-0" />
        <ParallaxBlur
          speed={0.12}
          className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-brand-500/25 blur-[90px]"
        />
        <ParallaxBlur
          speed={-0.12}
          className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-accent-500/20 blur-[90px]"
        />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-4">
          <div>
            <Reveal>
              <Eyebrow tone="onDark">Vì sao chọn Hợp Lực</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="mt-5 text-balance font-display text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[48px]">
                Đào tạo thực chiến,{" "}
                <em className="font-medium italic text-accent-400">đồng hành</em> đến khi có việc làm
              </h2>
            </Reveal>
            <ol className="mt-10 space-y-7">
              {features.map((f, i) => (
                <li key={f.title}>
                  <Reveal delay={180 + i * 90} className="group flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-accent-400 backdrop-blur transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent-500 group-hover:bg-accent-600 group-hover:text-white">
                      {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                    </div>
                    <div>
                      <div className="font-mono text-[11px] tracking-wider text-brand-200/60">{String(i + 1).padStart(2, "0")}</div>
                      <h3 className="font-display text-[20px] font-semibold">{f.title}</h3>
                      <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-brand-100/75">{f.desc}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <div className="relative h-[400px] sm:h-[560px]">
              <DnaScene3D theme="dark" className="absolute -inset-x-6 -inset-y-10 sm:-inset-x-12" />
              {/* Chỉ số nổi quanh chuỗi xoắn (desktop) */}
              <div className="absolute inset-0 hidden lg:block">
                {stats[0] && <div className="float-y absolute left-0 top-8 w-[200px]"><DarkStat value={stats[0].value} label={stats[0].label} /></div>}
                {stats[1] && <div className="float-y-slow absolute right-0 top-20 w-[200px]"><DarkStat value={stats[1].value} label={stats[1].label} accent /></div>}
                {stats[2] && <div className="float-y-slow absolute bottom-24 left-6 w-[200px]"><DarkStat value={stats[2].value} label={stats[2].label} accent /></div>}
                {stats[3] && <div className="float-y absolute bottom-6 right-8 w-[200px]"><DarkStat value={stats[3].value} label={stats[3].label} /></div>}
              </div>
              <div className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-brand-100/70 backdrop-blur-md lg:flex">
                <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-accent-500" />
                Di chuột để xoay mô hình
              </div>
            </div>
            {/* Chỉ số dạng lưới trên mobile/tablet */}
            <div className="mt-2 grid grid-cols-2 gap-3 lg:hidden">
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
        <section className="bg-paper px-6 py-24 sm:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Tin tức & sự kiện" title="Hợp Lực hôm nay" align="left" className="mb-0" />
              <Reveal delay={180}>
                <MoreLink href="/tin-tuc">Xem tất cả tin</MoreLink>
              </Reveal>
            </div>
            <div className={cn("grid gap-6", latestPosts.length > 0 && (pinnedPosts.length > 0 || nextEvents.length > 0) && "lg:grid-cols-[1fr_380px]")}>
              {latestPosts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {latestPosts.map((n, i) => {
                    const featured = i === 0;
                    // Chỉ có 1 tin nhỏ (tổng 2 bài) thì cho trải hết hàng, tránh trống nửa bên phải.
                    const fullRow = featured || latestPosts.length === 2;
                    // Tin nổi bật kiểu VinUni: ảnh phủ kín, chữ trắng đè trên lớp tối phía dưới.
                    if (featured) {
                      return (
                        <Reveal key={n.id} className="md:col-span-2">
                          <TiltCard max={2.5} className="rounded-[22px]">
                            <Link
                              href={`/tin-tuc/${n.slug}`}
                              className="group relative block h-[380px] overflow-clip rounded-[22px] shadow-md2 sm:h-[440px]"
                            >
                              <div className="img-reveal img-shine absolute inset-0">
                                {n.coverImageUrl ? (
                                  <Image
                                    src={n.coverImageUrl}
                                    alt={n.title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 860px"
                                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                                  />
                                ) : (
                                  <ImagePlaceholder label="Ảnh bài viết" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/95 via-brand-900/45 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-9">
                                <div className="mb-3 flex flex-wrap items-center gap-3">
                                  <span className="rounded bg-accent-600 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                                    {n.categoryName ?? "Tin nổi bật"}
                                  </span>
                                  <span className="font-mono text-[11px] text-white/75">{formatVNDate(n.publishedAt)}</span>
                                </div>
                                <h3 className="max-w-3xl font-display text-[24px] font-semibold leading-snug sm:text-[32px]">{n.title}</h3>
                                {n.excerpt && <p className="mt-3 line-clamp-2 max-w-2xl text-[14.5px] leading-relaxed text-white/80">{n.excerpt}</p>}
                                <span className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-bold">
                                  <span className="link-underline">Đọc tiếp</span>
                                  <span className="transition-transform group-hover:translate-x-1">→</span>
                                </span>
                              </div>
                            </Link>
                          </TiltCard>
                        </Reveal>
                      );
                    }
                    return (
                      <Reveal key={n.id} delay={i * 90} className={cn(fullRow && "md:col-span-2")}>
                        <TiltCard max={6} className="h-full rounded-[22px]">
                          {/* Mobile: hàng ngang gọn (ảnh nhỏ trái, chữ phải) cho khối tin không dài lê thê; từ md: thẻ ảnh lớn. */}
                          <Link
                            href={`/tin-tuc/${n.slug}`}
                            className="group flex h-full gap-4 overflow-clip rounded-[22px] border border-line bg-white p-3 shadow-sm2 transition-shadow hover:shadow-md2 md:block md:p-0"
                          >
                            <div className="img-reveal img-shine relative h-24 w-28 shrink-0 overflow-hidden rounded-2xl md:h-[190px] md:w-auto md:rounded-none">
                              {n.coverImageUrl ? (
                                <Image
                                  src={n.coverImageUrl}
                                  alt={n.title}
                                  fill
                                  sizes="(max-width: 768px) 112px, 380px"
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <ImagePlaceholder label="Ảnh bài viết" />
                              )}
                            </div>
                            <div className="min-w-0 py-1 md:p-5">
                              {/* Nhãn chuyên mục đỏ in hoa kiểu VinUni */}
                              <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                {n.categoryName && (
                                  <span className="whitespace-nowrap font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-600">
                                    {n.categoryName}
                                  </span>
                                )}
                                <span className="font-mono text-[10.5px] text-ink-faint">{formatVNDate(n.publishedAt)}</span>
                              </div>
                              <h3 className="line-clamp-3 font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700 md:text-[17px]">
                                {n.title}
                              </h3>
                            </div>
                          </Link>
                        </TiltCard>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              {(pinnedPosts.length > 0 || nextEvents.length > 0) && (
                // min-w-0 + minmax(0,1fr): dòng giờ/địa điểm sự kiện `truncate` (không xuống dòng) không được
                // đẩy cột rộng quá 380px — nếu không cả trang bị tràn ngang ~30px.
                <div className={cn("grid h-fit min-w-0 grid-cols-[minmax(0,1fr)] gap-6", latestPosts.length === 0 && "md:grid-cols-2")}>
                  {pinnedPosts.length > 0 && (
                    <Reveal delay={120}>
                      <aside className="overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2" aria-label="Thông báo">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-accent-600 to-accent-500 px-6 py-4 text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                            <path d="M12 2a5 5 0 00-5 5v3.6c0 .5-.2 1-.6 1.4L5 13.4c-.6.6-.2 1.6.6 1.6h13a1 1 0 00.7-1.6l-1.4-1.4a2 2 0 01-.6-1.4V7a5 5 0 00-5-5z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 18a3 3 0 006 0" strokeLinecap="round" />
                          </svg>
                          <span className="font-display text-[18px] font-semibold">Thông báo</span>
                        </div>
                        <ul className="divide-y divide-line">
                          {pinnedPosts.map((p) => {
                            const date = vnDayMonth(p.publishedAt);
                            return (
                              <li key={p.id}>
                                <Link href={`/tin-tuc/${p.slug}`} className="group flex gap-4 px-6 py-4 transition-colors hover:bg-brand-50">
                                  {date && (
                                    <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-paper text-center">
                                      <span className="font-display text-[20px] font-bold leading-none text-brand-900">{date.day}</span>
                                      <span className="mt-1 font-mono text-[9.5px] uppercase text-ink-faint">{date.month}</span>
                                    </span>
                                  )}
                                  <span className="min-w-0 text-[14px] font-semibold leading-snug text-ink group-hover:text-brand-700">
                                    {p.title}
                                    {p.attachmentUrl && (
                                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 align-middle text-[10.5px] font-semibold text-brand-700">
                                        📎 Tệp đính kèm
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
                      <aside className="overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2" aria-label="Sự kiện sắp diễn ra">
                        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-900 to-brand-700 px-6 py-4 text-white">
                          <span className="flex items-center gap-3">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <rect x="3" y="5" width="18" height="16" rx="2" />
                              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
                            </svg>
                            <span className="font-display text-[18px] font-semibold">Sự kiện sắp diễn ra</span>
                          </span>
                          <Link href="/su-kien" className="text-[12px] font-semibold text-brand-100 hover:text-white">
                            Lịch →
                          </Link>
                        </div>
                        <ul className="divide-y divide-line">
                          {nextEvents.map((e) => {
                            const date = vnDayMonth(e.startAt);
                            const body = (
                              <>
                                {date && (
                                  <span className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 text-center text-white shadow-sm2">
                                    <span className="font-display text-[20px] font-bold leading-none">{date.day}</span>
                                    <span className="mt-1 font-mono text-[9.5px] uppercase text-brand-100">{date.month}</span>
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:text-brand-700">{e.title}</span>
                                  <span className="mt-1 block truncate font-mono text-[10.5px] uppercase tracking-wider text-accent-600">
                                    {formatVNDateTime(e.startAt)}
                                    {e.location ? ` · ${e.location}` : ""}
                                  </span>
                                </span>
                              </>
                            );
                            return (
                              <li key={e.id}>
                                {e.slug ? (
                                  <Link href={`/su-kien/${e.slug}`} className="group flex gap-4 px-6 py-4 transition-colors hover:bg-brand-50">
                                    {body}
                                  </Link>
                                ) : (
                                  <div className="flex gap-4 px-6 py-4">{body}</div>
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

      {/* ============ 4. NGÀNH ĐÀO TẠO — slider thẻ màu "tràn mép" kiểu VinUni ============ */}
      {allPrograms.length > 0 && (
        <section className="overflow-hidden bg-paper-alt py-24">
          <div className="mx-auto mb-10 flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-6 sm:px-8">
            <SectionHeading
              eyebrow="Ngành đào tạo"
              title={`${allPrograms.length} ngành trọng điểm khối sức khoẻ`}
              description="Chương trình gắn chặt thực hành lâm sàng tại bệnh viện đối tác ngay từ năm nhất."
              align="left"
              className="mb-0"
            />
            <Reveal delay={180}>
              <MoreLink href="/nganh-dao-tao">Xem tất cả ngành</MoreLink>
            </Reveal>
          </div>
          <EdgeSlider label="Danh sách ngành đào tạo" itemClassName="min-h-[340px] w-[82%] sm:min-h-[360px] sm:w-[46%] lg:w-[31%] xl:w-[27%]">
            {allPrograms.map((p, i) => (
              <ProgramCard key={p.slug} program={p} gradientClass={programGradient(i)} delay={Math.min(i, 3) * 80} />
            ))}
          </EdgeSlider>
        </section>
      )}

      {/* ============ 5. SỨ MỆNH - TẦM NHÌN ============ */}
      {(content.missionText || content.visionText) && (
        <section className="px-6 pt-24 sm:px-8">
          <div className="mx-auto grid max-w-[1320px] gap-5 md:grid-cols-2">
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
        </section>
      )}

      {/* ============ 6. GIẢNG VIÊN ============ */}
      {facultyList.length > 0 && (
        <section className="px-6 py-24 sm:px-8">
          <div className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Đội ngũ giảng viên"
                title="Giảng viên giàu kinh nghiệm lâm sàng"
                align="left"
                className="mb-0"
              />
              <Reveal delay={180}>
                <MoreLink href="/doi-ngu-giang-vien">Xem tất cả đội ngũ</MoreLink>
              </Reveal>
            </div>
            <div className={cn(MOBILE_SWIPE_ROW, "sm:grid-cols-2 sm:gap-5 lg:grid-cols-4")}>
              {facultyList.slice(0, 4).map((f, i) => {
                const card = (
                  <>
                    <div className="img-reveal img-shine relative h-[220px]">
                      {f.photoUrl ? (
                        <Image
                          src={f.photoUrl}
                          alt={facultyDisplayName(f)}
                          fill
                          sizes="(max-width: 640px) 68vw, (max-width: 1024px) 50vw, 320px"
                          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <ImagePlaceholder label="Ảnh chân dung" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-display text-base font-semibold text-ink transition-colors group-hover:text-brand-700">
                        {facultyDisplayName(f)}
                      </h4>
                      <div className="mt-0.5 text-[12.5px] text-brand-700">{f.role}</div>
                    </div>
                  </>
                );
                const className =
                  "group block overflow-clip rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2";
                return (
                  <Reveal key={f.id} delay={i * 90} className={MOBILE_SWIPE_ITEM_NARROW}>
                    <TiltCard className="rounded-2xl">
                      {f.slug ? (
                        <Link href={`/doi-ngu-giang-vien/${f.slug}`} className={className}>
                          {card}
                        </Link>
                      ) : (
                        <div className={className}>{card}</div>
                      )}
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ 7. CÂU CHUYỆN THÀNH CÔNG (cựu SV) ============ */}
      {testimonials.length > 0 && (
        <TestimonialSlider
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
        <LightboxGroup items={galleryLightbox}>
          <div className="relative mx-auto max-w-[1320px]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Đời sống sinh viên"
                eyebrowTone="onDark"
                title="Trải nghiệm Hợp Lực"
                align="left"
                onDark
                className="mb-0"
              />
              <Reveal delay={180} className="flex flex-wrap items-center gap-6">
                {firstVideoIndex >= 0 && (
                  <LightboxTrigger
                    index={firstVideoIndex}
                    label="Xem video giới thiệu"
                    className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-white py-2 pl-2 pr-5 text-[13.5px] font-bold text-brand-900 shadow-lg2 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-600 to-accent-500 text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                    Xem video
                  </LightboxTrigger>
                )}
                <MoreLink href="/thu-vien" onDark>
                  Xem thư viện
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
                    <LightboxTrigger index={i} label={`${item.videoUrl ? "Xem video" : "Xem ảnh"}: ${item.caption}`} className="relative block h-full w-full cursor-zoom-in">
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
                        ["Thực hành lâm sàng", "Phòng thí nghiệm", "Lễ tốt nghiệp", "Hoạt động ngoại khoá", "Khuôn viên trường"][i]
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
        <section className="py-20" aria-label="Đối tác đào tạo">
          <div className="px-6 sm:px-8">
            <SectionHeading eyebrow="Đối tác" title="Đối tác đào tạo & thực hành lâm sàng" className="mb-10" />
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
                  <Eyebrow tone="onDark">Tuyển sinh</Eyebrow>
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
                    Đăng ký xét tuyển ngay
                  </Link>
                  <Link
                    href="/tra-cuu-ket-qua"
                    className="whitespace-nowrap rounded-xl border border-white/45 px-5 py-4 text-[14px] font-bold text-white transition-colors hover:bg-white/10 sm:px-7 sm:text-[15px]"
                  >
                    Tra cứu kết quả
                  </Link>
                </Reveal>
              </div>
              <div>
                <Reveal className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75">
                  Quy trình · {steps.length} bước xét tuyển
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
                  <div className="text-[14px] font-bold text-ink">Công khai theo quy định</div>
                  <div className="text-[12.5px] text-ink-faint">Tài chính, cơ sở vật chất, chương trình đào tạo, đội ngũ giảng viên</div>
                </div>
              </div>
              <span className="text-sm font-semibold text-brand-700">
                <span className="link-underline">Xem chi tiết</span> →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
