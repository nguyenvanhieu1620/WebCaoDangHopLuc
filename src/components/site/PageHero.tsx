import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getSiteSettings } from "@/lib/data/site-settings";
import { getPageBanner } from "@/lib/data/page-banners";
import type { PageBannerKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

type PageHeroProps = {
  title: ReactNode;
  /** Đường dẫn SAU "Trang chủ" — mục cuối là trang hiện tại (không cần href). */
  crumbs: Crumb[];
  eyebrow?: string;
  description?: ReactNode;
  /** Ảnh bìa riêng của trang/mục (VD ảnh bìa bài viết, trang tĩnh, ảnh ngành) — ưu tiên cao nhất. */
  imageUrl?: string | null;
  /**
   * Mã trang trong `PAGE_BANNER_SLOTS` — banner riêng của trang/chuyên mục đặt ở
   * admin/banner-trang-con. Thứ tự: `imageUrl` → banner của `bannerKey` → ảnh mặc
   * định chung → nền gradient xanh.
   */
  bannerKey?: PageBannerKey;
  /** "article": tiêu đề nhỏ hơn cho trang chi tiết có tiêu đề dài (bài viết, sự kiện). */
  variant?: "default" | "article";
  /** Dòng phụ dưới tiêu đề (VD ngày đăng, chuyên mục, nút). */
  children?: ReactNode;
};

/**
 * Banner đầu MỌI trang con (kiểu VinUni): ảnh nền + lớp phủ xanh đậm, đường
 * dẫn "Trang chủ › …", tiêu đề lớn. Kéo lên `-mt-[72px]` (đặt trên CHÍNH
 * section có overflow-hidden — xem bài học ở HeroBanner) để nằm dưới thanh
 * điều hướng trong suốt của SiteHeader; header chữ trắng nên trang con nào
 * cũng phải mở đầu bằng khối nền tối này (hoặc HeroBanner ở Trang chủ).
 */
export async function PageHero({ title, crumbs, eyebrow, description, imageUrl, bannerKey, variant = "default", children }: PageHeroProps) {
  const sectionBanner = !imageUrl && bannerKey ? await getPageBanner(bannerKey) : null;
  const fallback = imageUrl || sectionBanner ? null : (await getSiteSettings()).pageBannerUrl;
  const bg = imageUrl || sectionBanner || fallback || null;
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <section className="relative isolate -mt-[72px] overflow-hidden bg-brand-900 text-white">
      {bg ? (
        <>
          <Image src={bg} alt="" fill priority sizes="100vw" className="hero-kenburns object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/70 to-brand-900/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/80 via-transparent to-brand-900/60" />
        </>
      ) : (
        <>
          <div className="bg-grid-dark pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -left-32 -top-20 h-[440px] w-[440px] rounded-full bg-brand-500/30 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 right-[-6rem] h-[420px] w-[420px] rounded-full bg-accent-500/25 blur-[100px]" />
        </>
      )}
      <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

      <div
        className={cn(
          "relative mx-auto flex max-w-[1320px] flex-col justify-end px-6 pb-12 pt-[140px] sm:px-8 lg:pb-16",
          variant === "article" ? "min-h-[380px] lg:min-h-[460px]" : "min-h-[360px] sm:min-h-[400px] lg:min-h-[440px]"
        )}
      >
        <nav aria-label="Breadcrumb" className="hero-rise">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-white/65">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                Trang chủ
              </Link>
            </li>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-accent-400">›</span>
                  {c.href && !last ? (
                    <Link href={c.href} className="transition-colors hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={cn("truncate", last && "max-w-[60vw] text-white sm:max-w-md")}>
                      {c.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {eyebrow && (
          <div className="hero-rise mt-6" style={delay(80)}>
            <Eyebrow tone="onDark">{eyebrow}</Eyebrow>
          </div>
        )}
        <h1
          className={cn(
            "hero-rise mt-4 max-w-4xl text-balance font-display font-bold leading-[1.08] tracking-tight",
            variant === "article" ? "text-[30px] sm:text-[40px] lg:text-[46px]" : "text-[36px] sm:text-[50px] lg:text-[58px]"
          )}
          style={delay(140)}
        >
          {title}
        </h1>
        {description && (
          <p className="hero-rise mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-[16.5px]" style={delay(220)}>
            {description}
          </p>
        )}
        {children && (
          <div className="hero-rise mt-6" style={delay(280)}>
            {children}
          </div>
        )}
      </div>
      {/* Vạch nhấn đỏ ở mép dưới, kiểu VinUni */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-[min(38%,420px)] bg-gradient-to-r from-accent-600 to-accent-500" />
    </section>
  );
}
