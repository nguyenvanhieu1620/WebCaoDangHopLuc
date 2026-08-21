"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/db/schema";
import type { NavNode } from "@/lib/data/nav";

type SiteHeaderProps = {
  settings: Pick<SiteSettings, "hotline" | "email" | "announcement">;
  navTree: { primary: NavNode[]; secondary: NavNode[] };
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
 */
export function SiteHeader({ settings, navTree }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const mobileItems = [...navTree.primary, ...navTree.secondary];

  return (
    <div className="sticky top-0 z-50 font-sans">
      {/* Thanh thông báo */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-6 py-2 font-mono text-[11px] uppercase tracking-wider sm:px-8">
          <span className="truncate">{settings.announcement}</span>
          <div className="hidden shrink-0 gap-5 opacity-90 md:flex">
            <span>Hotline: {settings.hotline}</span>
            <span>{settings.email}</span>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng chính */}
      <div className="border-b border-brand-700/10 bg-paper/80 shadow-[0_4px_28px_rgba(6,50,90,0.07)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-6 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/images/logo-icon.png"
              alt={SITE.fullName}
              width={44}
              height={44}
              className="h-11 w-auto"
              priority
            />
            <div className="flex flex-col leading-[1.05]">
              <span className="font-display text-[19px] font-bold text-brand-700">
                {SITE.name}
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-accent-600">
                {SITE.tagline}
              </span>
            </div>
          </Link>

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-1 lg:flex">
            {navTree.primary.map((item) => (
              <div key={item.id} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                    isActive(item)
                      ? "text-brand-700"
                      : "text-ink hover:text-brand-700"
                  )}
                >
                  {item.label}
                  {item.children.length > 0 && (
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-0.5">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>
                {item.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-50 min-w-[220px] pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                    <div className="rounded-2xl border border-brand-700/10 bg-white/97 p-2 shadow-lg2 backdrop-blur-xl">
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.href}
                          className={cn(
                            "block rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold",
                            matches(child.href)
                              ? "bg-brand-50 text-brand-700"
                              : "text-ink hover:bg-brand-50 hover:text-brand-700"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {navTree.secondary.length > 0 && (
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Danh mục khác"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    navTree.secondary.some(isActive)
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink hover:bg-brand-50 hover:text-brand-700"
                  )}
                >
                  <div className="space-y-[3px]">
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                    <span className="block h-0.5 w-4 bg-current" />
                  </div>
                </button>
                <div className="invisible absolute right-0 top-full z-50 min-w-[240px] pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-2xl border border-brand-700/10 bg-white/97 p-2 shadow-lg2 backdrop-blur-xl">
                    {navTree.secondary.map((item) => (
                      <div key={item.id} className="py-1">
                        <Link
                          href={item.href}
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

          <div className="flex shrink-0 items-center gap-3">
            <Button href="/tuyen-sinh" className="hidden sm:inline-flex">
              Đăng ký xét tuyển
            </Button>
            <button
              aria-label="Mở menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line lg:hidden"
            >
              <span className="sr-only">Menu</span>
              <div className="space-y-1.5">
                <span className="block h-0.5 w-5 bg-ink" />
                <span className="block h-0.5 w-5 bg-ink" />
                <span className="block h-0.5 w-5 bg-ink" />
              </div>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <nav className="flex flex-col gap-1 border-t border-line bg-white px-6 py-4 lg:hidden">
            {mobileItems.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold",
                      isActive(item) ? "bg-brand-50 text-brand-700" : "text-ink"
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <button
                      type="button"
                      aria-label={`Mở rộng ${item.label}`}
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
                  <div className="ml-3 space-y-1 border-l border-line pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-[13.5px] font-medium",
                          matches(child.href) ? "text-brand-700" : "text-ink-soft"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button href="/tuyen-sinh" className="mt-2 justify-center">
              Đăng ký xét tuyển
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
