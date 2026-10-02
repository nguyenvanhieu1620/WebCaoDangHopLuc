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
import { programGradient } from "@/lib/constants";
import { getFeaturedPrograms, getPrograms } from "@/lib/data/programs";
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
const MOBILE_SWIPE_ITEM = "w-[84%] shrink-0 snap-start sm:w-auto";
const MOBILE_SWIPE_ITEM_NARROW = "w-[68%] shrink-0 snap-start sm:w-auto";

/** Nút dạng viên thuốc "Xem tất cả →" dùng chung cho đầu các khối. */
function PillLink({ href, children, onDark }: { href: string; children: React.ReactNode; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[13.5px] font-semibold transition-all duration-200",
        onDark
          ? "border-white/30 text-white hover:border-white hover:bg-white hover:text-brand-900"
          : "border-brand-700/20 bg-white text-brand-700 shadow-sm2 hover:border-brand-700 hover:bg-brand-700 hover:text-white"
      )}
    >
      {children}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}

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
    featuredPrograms,
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
    getFeaturedPrograms(),
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
      {/* ============ BANNER (tràn toàn màn hình) ============ */}
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
                "group relative flex items-center gap-3.5 p-4 transition-colors hover:bg-brand-50 sm:p-6",
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

      {/* ============ ĐỐI TÁC — dải chạy ngang vô tận ============ */}
      {partners.length > 0 && (
        <section className="pb-4 pt-16 sm:pt-20" aria-label="Đối tác đào tạo">
          <p className="mb-6 px-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Đối tác đào tạo &amp; thực hành lâm sàng
          </p>
          <div className="marquee overflow-hidden">
            <div className="marquee-track flex w-max items-center">
              {marqueeItems.map((p, i) => {
                const duplicate = i >= marqueeItems.length / 2;
                return (
                  <span
                    key={`${p.id}-${i}`}
                    aria-hidden={duplicate || undefined}
                    className={cn(
                      "mr-4 flex items-center gap-3 whitespace-nowrap rounded-full border border-line bg-white px-6 py-3 font-display text-[16px] font-semibold text-brand-900 shadow-sm2",
                      duplicate && "marquee-dup"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-accent-600 to-accent-500" />
                    {p.name}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ VÌ SAO CHỌN HỢP LỰC — khối 3D nền tối ============
          Cảnh DNA 3D đặt ở đây (không phải banner): theo các mẫu web đoạt giải,
          3D dùng để tạo không khí cho 1 khối kể chuyện giữa trang, còn banner
          đầu trang dành cho ảnh thật của trường. */}
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
          <Reveal>
            <Eyebrow tone="onDark">Vì sao chọn Hợp Lực</Eyebrow>
            <h2 className="mt-5 text-balance font-display text-[34px] font-semibold leading-[1.1] tracking-tight sm:text-[48px]">
              Đào tạo thực chiến,{" "}
              <em className="font-medium italic text-accent-400">đồng hành</em> đến khi có việc làm
            </h2>
            <ol className="mt-10 space-y-7">
              {features.map((f, i) => (
                <li key={f.title} className="group flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-accent-400 backdrop-blur transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-accent-500 group-hover:bg-accent-600 group-hover:text-white">
                    {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                  </div>
                  <div>
                    <div className="font-mono text-[11px] tracking-wider text-brand-200/60">{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-display text-[20px] font-semibold">{f.title}</h3>
                    <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-brand-100/75">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

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
                <DarkStat key={s.label} value={s.value} label={s.label} accent={i % 3 !== 0} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SỨ MỆNH - TẦM NHÌN ============ */}
      {(content.missionText || content.visionText) && (
        <section className="px-6 pt-24 sm:px-8">
          <Reveal className="mx-auto grid max-w-[1320px] gap-5 md:grid-cols-2">
            {[
              { text: content.missionText, label: "Sứ mệnh", tone: "blue" as const },
              { text: content.visionText, label: "Tầm nhìn", tone: "red" as const },
            ]
              .filter((b) => b.text)
              .map((b) => (
                <TiltCard key={b.label} max={4} className="h-full rounded-[24px] border border-line bg-white p-9 shadow-sm2">
                  <Eyebrow tone={b.tone} className="mb-5">
                    {b.label}
                  </Eyebrow>
                  <p className="font-display text-[19px] leading-relaxed text-brand-900 sm:text-[21px]">
                    <span className="mr-1 font-display text-[40px] leading-none text-accent-500/50">“</span>
                    {b.text}
                  </p>
                </TiltCard>
              ))}
          </Reveal>
        </section>
      )}

      {/* ============ PROGRAMS ============ */}
      <section className="bg-paper-alt px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-[1320px]">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Ngành đào tạo"
              title={`${allPrograms.length} ngành trọng điểm khối sức khoẻ`}
              description="Chương trình gắn chặt thực hành lâm sàng tại bệnh viện đối tác ngay từ năm nhất."
              align="left"
              className="mb-0"
            />
            <PillLink href="/nganh-dao-tao">Xem tất cả ngành</PillLink>
          </Reveal>
          <div className={cn(MOBILE_SWIPE_ROW, "sm:grid-cols-2 sm:gap-5 lg:grid-cols-3")}>
            {featuredPrograms.map((p, i) => (
              <div key={p.slug} className={MOBILE_SWIPE_ITEM}><ProgramCard program={p} gradientClass={programGradient(i)} delay={i * 80} /></div>
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
                  "repeating-linear-gradient(90deg, var(--brand-700) 0 8px, transparent 8px 16px)",
              }}
            />
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 90} className="relative flex items-start gap-4 text-left sm:block sm:text-center">
                <div className="relative z-10 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-brand-700 bg-white font-mono text-[13px] font-semibold text-brand-700 shadow-sm2 sm:mx-auto sm:mb-5">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {/* Mobile: số bên trái, chữ bên phải (gọn hơn xếp giữa); từ sm trở lên: xếp giữa như cũ. */}
                <div className="pt-1.5 sm:pt-0">
                  <h4 className="font-display text-base font-semibold text-ink">{s.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{s.desc}</p>
                </div>
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
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Đời sống sinh viên"
              eyebrowTone="onDark"
              title="Khoảnh khắc tại Hợp Lực"
              align="left"
              onDark
              className="mb-0"
            />
            <PillLink href="/thu-vien" onDark>
              Xem thư viện
            </PillLink>
          </div>
          {/* Chiều cao đặt qua grid-rows (không trộn h-[160px] với h-full trên cùng phần tử —
              `cn()` không gộp class, 2 class cùng thuộc tính sẽ không rõ class nào thắng,
              từng làm ô lớn đầu tiên co thành vạch mỏng trên mobile). */}
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 5 }, (_, i) => galleryItems[i]).map((item, i) => (
              <Reveal
                key={item?.id ?? i}
                delay={i * 90}
                className={cn(
                  "relative overflow-hidden rounded-[18px]",
                  // Ô 0 lớn 2×2, 4 ô còn lại lấp kín 2 cột bên phải (desktop) / 2 hàng dưới (mobile).
                  i === 0 && "col-span-2 row-span-2"
                )}
              >
                {item ? (
                  <GalleryMedia item={item} className="h-full w-full" />
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
              <PillLink href="/doi-ngu-giang-vien">Xem tất cả đội ngũ</PillLink>
            </div>
            <div className={cn(MOBILE_SWIPE_ROW, "sm:grid-cols-2 sm:gap-5 lg:grid-cols-4")}>
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
                  "block overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2";
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
        <section className="px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Lịch sự kiện" eyebrowTone="red" title="Sự kiện sắp diễn ra" align="left" className="mb-0" />
              <PillLink href="/su-kien">Xem tất cả sự kiện</PillLink>
            </div>
            <div className={cn(MOBILE_SWIPE_ROW, "sm:grid-cols-3 sm:gap-6")}>
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
                  "block h-full overflow-hidden rounded-2xl border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2";
                return (
                  <Reveal key={e.id} delay={i * 90} className={cn(MOBILE_SWIPE_ITEM, "h-full")}>
                    <TiltCard className="h-full rounded-2xl">
                      {e.slug ? (
                        <Link href={`/su-kien/${e.slug}`} className={className}>
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
          </Reveal>
        </section>
      )}

      {/* ============ TIN TỨC & THÔNG BÁO — dàn trang kiểu tạp chí ============
          Trái: 1 tin nổi bật lớn + 2 tin nhỏ. Phải: bảng "Thông báo" (bài được ghim). */}
      {(latestPosts.length > 0 || pinnedPosts.length > 0) && (
        <section className="bg-paper-alt px-6 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-[1320px]">
            <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Tin tức & thông báo" title="Hợp Lực hôm nay" align="left" className="mb-0" />
              <PillLink href="/tin-tuc">Xem tất cả tin</PillLink>
            </div>
            <div className={cn("grid gap-6", pinnedPosts.length > 0 && latestPosts.length > 0 && "lg:grid-cols-[1fr_380px]")}>
              {latestPosts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {latestPosts.map((n, i) => {
                    const featured = i === 0;
                    // Chỉ có 1 tin nhỏ (tổng 2 bài) thì cho trải hết hàng, tránh trống nửa bên phải.
                    const fullRow = featured || latestPosts.length === 2;
                    return (
                      <Reveal key={n.id} delay={i * 90} className={cn(fullRow && "md:col-span-2")}>
                        <TiltCard max={featured ? 3 : 6} className="h-full rounded-[22px]">
                          <Link
                            href={`/tin-tuc/${n.slug}`}
                            className={cn(
                              "group block h-full overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2 transition-shadow hover:shadow-md2",
                              featured && "md:grid md:grid-cols-[1.15fr_1fr]"
                            )}
                          >
                            <div className={cn("relative overflow-hidden", featured ? "h-[240px] md:h-full md:min-h-[320px]" : "h-[180px]")}>
                              {n.coverImageUrl ? (
                                <Image
                                  src={n.coverImageUrl}
                                  alt={n.title}
                                  fill
                                  sizes={featured ? "(max-width: 768px) 100vw, 560px" : "(max-width: 768px) 100vw, 380px"}
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <ImagePlaceholder label="Ảnh bài viết" />
                              )}
                              {featured && (
                                <span className="absolute left-4 top-4 rounded-full bg-accent-600 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white shadow-red">
                                  Nổi bật
                                </span>
                              )}
                            </div>
                            <div className={cn("flex flex-col", featured ? "p-7 md:justify-center md:p-9" : "p-5")}>
                              <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-ink-faint">
                                {formatVNDate(n.publishedAt)}
                                {n.categoryName ? ` · ${n.categoryName}` : ""}
                              </div>
                              <h3
                                className={cn(
                                  "font-display font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700",
                                  featured ? "text-[24px] sm:text-[28px]" : "text-[17px]"
                                )}
                              >
                                {n.title}
                              </h3>
                              {featured && n.excerpt && (
                                <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-soft">{n.excerpt}</p>
                              )}
                              {featured && <span className="mt-5 text-[13.5px] font-bold text-brand-700">Đọc tiếp →</span>}
                            </div>
                          </Link>
                        </TiltCard>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              {pinnedPosts.length > 0 && (
                <aside className="h-fit overflow-hidden rounded-[22px] border border-line bg-white shadow-sm2" aria-label="Thông báo">
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
              )}
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
