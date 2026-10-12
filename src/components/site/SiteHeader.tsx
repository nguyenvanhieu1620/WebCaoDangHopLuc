"use client";

import Link from "next/link";
import Form from "next/form";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import type { SiteSettings } from "@/lib/db/schema";
import type { NavNode } from "@/lib/data/nav";
import type { Locale } from "@/lib/locale";

type SiteHeaderProps = {
  settings: Pick<SiteSettings, "hotline" | "email" | "announcement">;
  navTree: { primary: NavNode[]; secondary: NavNode[] };
  locale: Locale;
};

/**
 * Header dùng chung cho mọi trang công khai: thanh thông báo + logo + menu + CTA.
 * Menu lấy từ `nav_items` trong DB (quản lý qua admin/menu) — mỗi danh mục to
 * có thể có danh mục con, hover vào hiện dropdown con. Danh mục to đánh dấu
 * "không phải menu chính" nằm gọn trong nút ☰ riêng bên cạnh thanh ngang.
 * Mục nav "active" tự xác định từ URL hiện tại (usePathname) — không cần
 * truyền prop thủ công ở từng trang.
 * `settings` (hotline/email/banner thông báo) lấy từ DB ở layout cha, quản lý
 * qua admin/cai-dat.
 *
 * Bàn phím: dropdown danh mục to mở cả khi hover lẫn khi focus nằm trong
 * khối (Tab tới), Escape đóng rồi trả focus về mục cha. Nút ☰ "Danh mục
 * khác" là nút disclosure — Enter/click mở/đóng qua state (`aria-expanded`),
 * tự đóng khi focus/bấm chuột ra ngoài hoặc khi rê sang danh mục to khác
 * (tránh 2 dropdown chồng lên nhau).
 *
 * Danh mục to có từ `MEGA_MIN_CHILDREN` mục con trở lên hiện dạng mega menu
 * (lưới 2 cột kèm mô tả ngắn `nav_items.description` + khối kêu gọi tuyển
 * sinh). Nút kính lúp (hoặc phím "/", Ctrl+K) mở ô tìm kiếm → /tim-kiem.
 */
const SECONDARY_ID = "__secondary";

const LABELS = {
  vi: {
    mainNav: "Menu chính",
    more: "Danh mục khác",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
    expand: (label: string) => `Mở rộng ${label}`,
    collapse: (label: string) => `Thu gọn ${label}`,
    search: "Tìm kiếm",
    searchPlaceholder: "Tìm ngành học, tin tức, học phí, hồ sơ…",
    searchSubmit: "Tìm",
    viewAll: (label: string) => `Xem tất cả ${label.toLocaleLowerCase("vi")}`,
    promoEyebrow: "Tuyển sinh",
    promoTitle: "Bắt đầu hành trình y dược của bạn",
    promoCta: "Đăng ký xét tuyển",
    explore: "Khám phá thêm",
    hotlineLabel: "Gọi tư vấn tuyển sinh",
  },
  en: {
    mainNav: "Main navigation",
    more: "More sections",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    expand: (label: string) => `Expand ${label}`,
    collapse: (label: string) => `Collapse ${label}`,
    search: "Search",
    searchPlaceholder: "Search programs, news, tuition…",
    searchSubmit: "Search",
    viewAll: (label: string) => `View all ${label.toLowerCase()}`,
    promoEyebrow: "Admissions",
    promoTitle: "Start your healthcare journey",
    promoCta: "Apply now",
    explore: "Explore more",
    hotlineLabel: "Admissions hotline",
  },
} as const;

/** Danh mục to có từ chừng này mục con trở lên thì hiện dạng mega menu (lưới + khối giới thiệu). */
const MEGA_MIN_CHILDREN = 4;

const PANEL_HIDDEN = "invisible opacity-0";
const PANEL_REVEAL_ON_GROUP =
  "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

export function SiteHeader({ settings, navTree, locale }: SiteHeaderProps) {
  const pathname = usePathname();
  const t = LABELS[locale] ?? LABELS.vi;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [hoveredPrimary, setHoveredPrimary] = useState<string | null>(null);
  // Dropdown vừa bị Escape đóng — tạm tắt hover/focus-within của khối đó cho
  // tới khi chuột/focus rời khỏi khối, nếu không CSS sẽ hiện lại ngay.
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  // Ô tìm kiếm gắn với URL lúc mở: điều hướng sang trang khác (VD gửi tìm kiếm
  // → /tim-kiem) thì tự đóng mà không cần effect hay onSubmit (đóng ngay trong
  // onSubmit sẽ gỡ form khỏi DOM trước khi kịp gửi → mất lượt tìm kiếm).
  const [searchOpenAt, setSearchOpenAt] = useState<string | null>(null);
  const searchOpen = searchOpenAt === pathname;
  const setSearchOpen = (next: boolean | ((open: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(searchOpen) : next;
    setSearchOpenAt(value ? pathname : null);
  };
  const secondaryWrapperRef = useRef<HTMLDivElement>(null);
  const secondaryButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Kiểu VinUni: thanh điều hướng TRONG SUỐT đè lên banner đầu trang, chữ
  // trắng; cuộn xuống > 24px (hoặc mở menu/tìm kiếm) thì chuyển nền xanh đậm
  // mờ. Áp dụng MỌI trang công khai — trang nào cũng mở đầu bằng khối nền tối
  // (HeroBanner ở Trang chủ, PageHero ở trang con), cả 2 kéo lên -mt-[72px]
  // để nằm dưới thanh này. Đổi chiều cao (h-[72px] bên dưới) thì đổi cả 2 chỗ đó.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const transparentNav = !scrolled && !mobileOpen && !searchOpen;

  // Phím tắt mở ô tìm kiếm: "/" hoặc Ctrl/⌘+K (khi không đang gõ trong ô nhập).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault();
        // Đọc URL hiện tại trực tiếp (effect chỉ đăng ký 1 lần, `pathname` trong closure sẽ cũ sau khi chuyển trang).
        setSearchOpenAt(window.location.pathname);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!secondaryOpen && !mobileOpen && !hoveredPrimary && !searchOpen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (searchOpen) {
        setSearchOpenAt(null);
        searchButtonRef.current?.focus();
      }
      if (hoveredPrimary) setDismissedId(hoveredPrimary);
      if (secondaryOpen) {
        setSecondaryOpen(false);
        setDismissedId(SECONDARY_ID);
        secondaryButtonRef.current?.focus();
      }
      if (mobileOpen) {
        setMobileOpen(false);
        mobileButtonRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (secondaryOpen && !secondaryWrapperRef.current?.contains(e.target as Node)) {
        setSecondaryOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [secondaryOpen, mobileOpen, hoveredPrimary, searchOpen]);

  const clearDismissed = (id: string) =>
    setDismissedId((prev) => (prev === id ? null : prev));

  const leftGroup = (e: FocusEvent<HTMLDivElement>) =>
    !e.currentTarget.contains(e.relatedTarget as Node | null);

  const onPrimaryKeyDown = (id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    setDismissedId(id);
    e.currentTarget.querySelector<HTMLAnchorElement>("a")?.focus();
  };

  const onSecondaryKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    setSecondaryOpen(false);
    setDismissedId(SECONDARY_ID);
    secondaryButtonRef.current?.focus();
  };

  const toggleSecondary = () => {
    if (secondaryOpen) {
      setSecondaryOpen(false);
      setDismissedId(SECONDARY_ID);
    } else {
      setSecondaryOpen(true);
      clearDismissed(SECONDARY_ID);
    }
  };

  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isActive = (item: NavNode) =>
    matches(item.href) || item.children.some((c) => matches(c.href));

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


  return (
    <div className="sticky top-0 z-50 font-sans" style={{ viewTransitionName: "site-header" }}>
      {/* Thanh thông báo */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-6 py-2 font-mono text-[11px] uppercase tracking-wider sm:px-8">
          <span className="truncate">{settings.announcement}</span>
          <div className="flex shrink-0 items-center gap-5 opacity-90">
            <span className="hidden md:inline">Hotline: {settings.hotline}</span>
            <span className="hidden md:inline">{settings.email}</span>
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
      </div>

      {/* Thanh điều hướng chính — cao cố định 72px (HeroBanner dựa vào số này để kéo ảnh lên dưới header) */}
      <div
        className={cn(
          "relative h-[72px] border-b transition-[background-color,box-shadow,border-color] duration-300",
          transparentNav
            ? "border-white/10 bg-transparent"
            : // Kính mờ chỉ từ lg: trên điện thoại (nhất là Safari iOS) backdrop-blur của thanh cố định phải
              // làm mờ lại mọi thứ đang chuyển động phía sau (cảnh 3D, banner) mỗi khung hình → giật.
              "border-white/10 bg-brand-900/95 shadow-[0_12px_40px_-14px_rgba(6,50,90,0.55)] lg:bg-brand-900/85 lg:backdrop-blur-xl"
        )}
      >
        {/* Thanh tiến trình đọc trang — CSS scroll-driven (globals.css .scroll-progress), trình duyệt chưa hỗ trợ thì ẩn */}
        <span aria-hidden="true" className="scroll-progress" />
        {/* Logo chính thức của trường, ĐÚNG MÀU GỐC (public/images/logo.png — y nguyên file trường gửi)
            đặt trên ô nền trắng bo góc: header luôn nền tối, logo đỏ/xanh đặt thẳng lên sẽ chìm.
            Logo đã chứa tên trường nên không ghép thêm chữ; 360px vẫn đủ chỗ cho ô logo + 2 nút. */}
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-3 px-6 sm:gap-6 sm:px-8">
          <Link href="/" className="flex min-w-0 shrink items-center rounded-xl bg-white px-3 py-1.5 shadow-md2">
            <Image
              src="/images/logo.png"
              alt={SITE.fullName}
              width={1137}
              height={315}
              sizes="160px"
              className="h-8 w-auto lg:h-10"
              priority
            />
          </Link>

          <nav
            aria-label={t.mainNav}
            className="hidden flex-1 flex-wrap items-center justify-center gap-1 lg:flex"
          >
            {navTree.primary.map((item) => (
              <div
                key={item.id}
                className="group relative"
                onMouseEnter={() => { setSecondaryOpen(false); setHoveredPrimary(item.id); }}
                onMouseLeave={() => { clearDismissed(item.id); setHoveredPrimary(null); }}
                onBlur={(e) => leftGroup(e) && clearDismissed(item.id)}
                onKeyDown={item.children.length > 0 ? onPrimaryKeyDown(item.id) : undefined}
              >
                <Link
                  href={item.href}
                  className={cn(
                    // 1024–1279px: chữ/khoảng cách nhỏ hơn để menu Montserrat (rộng) không xuống 2 dòng.
                    "relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors xl:px-3 xl:text-[13.5px]",
                    // Gạch chân đỏ chạy ra khi hover / đang ở mục đó (kiểu VinUni).
                    "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent-500 after:transition-transform after:duration-300 after:content-[''] hover:after:scale-x-100",
                    isActive(item) ? "text-white after:scale-x-100" : "text-white/80 hover:text-white"
                  )}
                >
                  {item.label}
                  {item.children.length > 0 && (
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-0.5">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>
                {item.children.length >= MEGA_MIN_CHILDREN && (
                  <div
                    className={cn(
                      "mega-panel absolute left-1/2 top-full z-50 w-[min(720px,92vw)] -translate-x-1/2 pt-3",
                      PANEL_HIDDEN,
                      dismissedId !== item.id && PANEL_REVEAL_ON_GROUP
                    )}
                  >
                    <div className="grid grid-cols-[1fr_230px] overflow-hidden rounded-[22px] border border-brand-700/10 bg-white shadow-[0_30px_70px_-20px_rgba(6,50,90,0.35)]">
                      <div className="grid grid-cols-2 gap-1 p-3">
                        {item.children.map((child, i) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={cn(
                              "group/item flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
                              matches(child.href) ? "bg-brand-50" : "hover:bg-brand-50"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-mono text-[11px] font-semibold text-white shadow-sm2 transition-transform group-hover/item:-translate-y-0.5 group-hover/item:rotate-[-4deg]",
                                i % 3 === 2 ? "from-accent-700 to-accent-500" : i % 3 === 1 ? "from-brand-900 to-brand-600" : "from-brand-800 to-brand-500"
                              )}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0">
                              <span className={cn("block text-[13.5px] font-semibold", matches(child.href) ? "text-brand-700" : "text-ink group-hover/item:text-brand-700")}>
                                {child.label}
                              </span>
                              {child.description && (
                                <span className="mt-0.5 block truncate text-[11.5px] text-ink-faint">{child.description}</span>
                              )}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-5 text-white">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/40 blur-[40px]" />
                        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-brand-500/50 blur-[40px]" />
                        <div className="relative">
                          <div className="font-mono text-[10px] uppercase tracking-wider text-brand-200">{t.promoEyebrow}</div>
                          <div className="mt-2 font-display text-[19px] font-semibold leading-snug">{t.promoTitle}</div>
                        </div>
                        <div className="relative mt-5 space-y-2">
                          <Link
                            href="/tuyen-sinh#dang-ky"
                            className="block rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 px-3.5 py-2.5 text-center text-[13px] font-bold text-white shadow-red"
                          >
                            {t.promoCta}
                          </Link>
                          <Link href={item.href} className="block text-center text-[12.5px] font-semibold text-brand-100 hover:text-white">
                            {t.viewAll(item.label)} →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {item.children.length > 0 && item.children.length < MEGA_MIN_CHILDREN && (
                  <div
                    className={cn(
                      "mega-panel absolute left-0 top-full z-50 min-w-[240px] pt-3",
                      PANEL_HIDDEN,
                      dismissedId !== item.id && PANEL_REVEAL_ON_GROUP
                    )}
                  >
                    <div className="rounded-2xl border border-brand-700/10 bg-white p-2 shadow-lg2">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3.5 py-2.5",
                            matches(child.href)
                              ? "bg-brand-50 text-brand-700"
                              : "text-ink hover:bg-brand-50 hover:text-brand-700"
                          )}
                        >
                          <span className="block text-[13.5px] font-semibold">{child.label}</span>
                          {child.description && <span className="block text-[11.5px] text-ink-faint">{child.description}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {navTree.secondary.length > 0 && (
              <div
                ref={secondaryWrapperRef}
                className="group relative"
                onMouseEnter={() => { clearDismissed(SECONDARY_ID); setSecondaryOpen(true); }}
                onMouseLeave={() => {
                  clearDismissed(SECONDARY_ID);
                  if (!secondaryWrapperRef.current?.contains(document.activeElement)) setSecondaryOpen(false);
                }}
                onBlur={(e) => {
                  if (!leftGroup(e)) return;
                  setSecondaryOpen(false);
                  clearDismissed(SECONDARY_ID);
                }}
                onKeyDown={onSecondaryKeyDown}
              >
                <button
                  ref={secondaryButtonRef}
                  type="button"
                  aria-label={t.more}
                  aria-haspopup="true"
                  aria-expanded={secondaryOpen}
                  aria-controls="site-secondary-nav"
                  onClick={toggleSecondary}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    navTree.secondary.some(isActive) || secondaryOpen
                      ? "bg-white/15 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="space-y-[3px]">
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </div>
                </button>
                {/* Mở bằng state (click/Enter) hoặc hover; focus-within trên
                    chính panel giữ nó mở khi Tab qua các link bên trong. */}
                <div
                  id="site-secondary-nav"
                  className={cn(
                    "absolute right-0 top-full z-50 min-w-[240px] pt-2 transition-opacity duration-150",
                    secondaryOpen
                      ? "visible opacity-100"
                      : cn(
                          PANEL_HIDDEN,
                          "focus-within:visible focus-within:opacity-100",
                          dismissedId !== SECONDARY_ID && "group-hover:visible group-hover:opacity-100"
                        )
                  )}
                >
                  <div className="rounded-2xl border border-brand-700/10 bg-white p-2 shadow-lg2">
                    {navTree.secondary.map((item) => (
                      <div key={item.id} className="py-1">
                        <Link
                          href={item.href}
                          onClick={() => setSecondaryOpen(false)}
                          className={cn(
                            "block rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold",
                            matches(item.href)
                              ? "bg-brand-50 text-brand-700"
                              : "text-ink hover:bg-brand-50 hover:text-brand-700"
                          )}
                        >
                          {item.label}
                        </Link>
                        {item.children.length > 0 && (
                          <div className="ml-3.5 border-l border-line pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={() => setSecondaryOpen(false)}
                                className={cn(
                                  "block rounded-lg px-3 py-2 text-[13px] font-medium",
                                  matches(child.href)
                                    ? "text-brand-700"
                                    : "text-ink-soft hover:text-brand-700"
                                )}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              ref={searchButtonRef}
              type="button"
              aria-label={t.search}
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              onClick={() => {
                setSearchOpen((v) => !v);
                setMobileOpen(false);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                searchOpen
                  ? "border-white bg-white/15 text-white"
                  : "border-white/25 text-white hover:border-white/60 hover:bg-white/10"
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" strokeLinecap="round" />
              </svg>
            </button>
            {/* Ẩn ở 1024–1279px (không đủ chỗ cạnh menu ngang); mobile đã có MobileActionBar, Hero có nút riêng. */}
            <Button href="/tuyen-sinh" className="hidden sm:inline-flex lg:hidden xl:inline-flex">
              Đăng ký xét tuyển
            </Button>
            <button
              ref={mobileButtonRef}
              type="button"
              aria-label={mobileOpen ? t.closeMenu : t.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-nav"
              onClick={() => {
                setMobileOpen((v) => !v);
                setSearchOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white lg:hidden"
            >
              {/* 3 vạch biến thành dấu × khi mở menu */}
              <div className="relative h-3.5 w-5">
                <span className={cn("absolute left-0 top-0 block h-0.5 w-5 rounded bg-current transition-transform duration-300", mobileOpen && "translate-y-1.5 rotate-45")} />
                <span className={cn("absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-opacity duration-200", mobileOpen && "opacity-0")} />
                <span className={cn("absolute left-0 top-3 block h-0.5 w-5 rounded bg-current transition-transform duration-300", mobileOpen && "-translate-y-1.5 -rotate-45")} />
              </div>
            </button>
          </div>
        </div>

        {/* Ô tìm kiếm thả xuống — GET /tim-kiem, không cần JS để tìm (chỉ để mở/đóng). */}
        {searchOpen && (
          <div id="site-search-panel" className="search-drop border-t border-line bg-white/95 backdrop-blur-xl">
            <Form
              action="/tim-kiem"
              role="search"
              className="mx-auto flex max-w-[860px] items-center gap-2 px-6 py-4 sm:px-8"
            >
              <label htmlFor="header-search" className="sr-only">{t.search}</label>
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-faint" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" strokeLinecap="round" />
                </svg>
                <input
                  id="header-search"
                  name="q"
                  type="search"
                  autoFocus
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder={t.searchPlaceholder}
                  className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                />
                <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:inline">Esc</kbd>
              </div>
              <button type="submit" className="h-11 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800">
                {t.searchSubmit}
              </button>
            </Form>
          </div>
        )}

        {/* Menu mobile */}
        {mobileOpen && (
          // Tự cuộn trong khung màn hình (header dính nên menu dài hơn màn hình sẽ bị
          // khuất phần cuối nếu không cuộn riêng); pb chừa chỗ cho thanh MobileActionBar.
          <nav
            id="site-mobile-nav"
            aria-label={t.mainNav}
            className="max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain border-t border-line bg-white px-5 pb-28 pt-3 lg:hidden"
          >
            <div className="flex flex-col gap-0.5">
            {navTree.primary.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-3 text-[15px] font-semibold",
                      isActive(item) ? "bg-brand-50 text-brand-700" : "text-ink"
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <button
                      type="button"
                      aria-label={expanded.has(item.id) ? t.collapse(item.label) : t.expand(item.label)}
                      aria-expanded={expanded.has(item.id)}
                      aria-controls={`site-mobile-sub-${item.id}`}
                      onClick={() => toggleExpanded(item.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-soft"
                    >
                      <svg
                        width="12"
                        height="8"
                        viewBox="0 0 12 8"
                        fill="none"
                        className={cn("transition-transform", expanded.has(item.id) && "rotate-180")}
                      >
                        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
                {item.children.length > 0 && expanded.has(item.id) && (
                  <div id={`site-mobile-sub-${item.id}`} className="search-drop ml-3 space-y-0.5 border-l-2 border-brand-100 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block rounded-lg px-3 py-2",
                          matches(child.href) ? "text-brand-700" : "text-ink-soft"
                        )}
                      >
                        <span className="block text-[14px] font-medium">{child.label}</span>
                        {child.description && <span className="block text-[11.5px] text-ink-faint">{child.description}</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>

            {/* Danh mục phụ (nút ☰ trên desktop) — lưới 2 cột cho gọn thay vì nối dài danh sách. */}
            {navTree.secondary.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <div className="mb-2.5 px-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">{t.explore}</div>
                <div className="grid grid-cols-2 gap-2">
                  {navTree.secondary.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-[13.5px] font-semibold",
                        isActive(item) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-paper text-ink"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <a
              href={`tel:${settings.hotline.replace(/\s+/g, "")}`}
              className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 px-5 py-4 text-white"
            >
              <span>
                <span className="block font-mono text-[10.5px] uppercase tracking-wider text-brand-200">{t.hotlineLabel}</span>
                <span className="block font-display text-[20px] font-semibold">{settings.hotline}</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2C9.5 21 3 14.5 3 6a2 2 0 0 1 1-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          </nav>
        )}
      </div>
    </div>
  );
}
