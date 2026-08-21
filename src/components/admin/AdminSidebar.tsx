"use client";

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ADMIN_NAV, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth-actions";

type AdminSidebarProps = {
  userName: string;
};

/**
 * Sidebar dùng chung cho toàn bộ trang trong khu vực quản trị (CMS).
 * Mục active tự xác định qua usePathname, tương tự SiteHeader.
 */
export function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-brand-900 via-[#0A3D6E] to-brand-700 text-white shadow-[4px_0_24px_rgba(6,50,90,0.15)]">
      <Link
        href="/"
        className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5"
      >
        <Image
          src="/images/logo-icon.png"
          alt={SITE.fullName}
          width={34}
          height={34}
          className="h-[34px] w-auto"
        />
        <div className="leading-[1.05]">
          <div className="font-display text-[15px] font-bold">{SITE.name}</div>
          <div className="font-mono text-[8.5px] uppercase tracking-wider text-accent-500">
            CMS Admin
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 pt-3.5 font-mono text-[10px] uppercase tracking-wider text-[#5C93BE]">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
                    active
                      ? "bg-white/[0.14] text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)_inset,0_0_0_1px_rgba(255,255,255,0.1)]"
                      : "text-[#C9DCEA] hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      active
                        ? "bg-gradient-to-br from-accent-500 to-accent-600"
                        : "bg-white/30"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-white/10 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent-600 to-accent-500 text-sm font-bold">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[13px] font-semibold">{userName}</div>
          <div className="text-[11px] text-[#9FC3E0]">Quản trị viên</div>
        </div>
        <button
          onClick={() => logoutAction()}
          className="text-[11px] text-[#9FC3E0] hover:text-white"
        >
          Thoát
        </button>
      </div>
    </aside>
  );
}
