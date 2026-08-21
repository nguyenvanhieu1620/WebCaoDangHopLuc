"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE, SITE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/db/schema";

type SiteHeaderProps = {
  settings: Pick<SiteSettings, "hotline" | "email" | "announcement">;
};

/**
 * Header dùng chung cho mọi trang công khai: thanh thông báo + logo + menu + CTA.
 * Mục nav "active" được tự xác định từ URL hiện tại (usePathname) — không cần
 * truyền prop thủ công ở từng trang, tránh sai lệch khi thêm/sửa route.
 * Trên màn hình hẹp, menu rút gọn về dạng hamburger.
 * `settings` (hotline/email/banner thông báo) lấy từ DB ở layout cha, quản lý
 * qua admin/cai-dat.
 */
export function SiteHeader({ settings }: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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

          <nav className="hidden flex-1 flex-wrap items-center justify-center gap-1.5 lg:flex">
            {SITE_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                  isActive(item.href)
                    ? "text-brand-700"
                    : "text-ink hover:text-brand-700"
                )}
              >
                {item.label}
              </Link>
            ))}
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
            {SITE_NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold",
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink"
                )}
              >
                {item.label}
              </Link>
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
