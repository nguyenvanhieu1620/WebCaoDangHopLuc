"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_NAV, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth-actions";
import { useAdminMobileMenu } from "@/components/admin/AdminMobileMenuContext";

type AdminSidebarProps = {
  userName: string;
  /** Danh sách module được phép truy cập — `null` = toàn quyền (hiện hết). */
  permissions: string[] | null;
};

/**
 * Sidebar dùng chung cho toàn bộ trang trong khu vực quản trị (CMS).
 * Mỗi mục trong ADMIN_NAV là 1 thực thể — có `children` thì hiện dạng khối
 * thu gọn/mở rộng được (header chỉ để bấm đóng/mở, không phải link), không
 * có `children` thì là link thẳng. Khối chứa trang đang mở tự động mở sẵn.
 * "Dashboard" luôn hiện (mọi tài khoản đăng nhập đều xem được) — các mục
 * còn lại lọc theo `permissions` (xem `src/lib/admin-auth.ts`).
 */
export function AdminSidebar({ userName, permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, close } = useAdminMobileMenu();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Đổi trang (bấm 1 link trong menu) thì tự đóng drawer trên di động —
  // không bắt người dùng bấm thêm 1 lần nữa để đóng.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const visibleNav = ADMIN_NAV.filter(
    (entity) => entity.key === "dashboard" || permissions === null || permissions.includes(entity.key)
  );

  const [openKeys, setOpenKeys] = useState<Set<string>>(
    () =>
      new Set(
        visibleNav.filter((entity) => entity.children?.some((c) => isActive(c.href))).map(
          (entity) => entity.key
        )
      )
  );

  const toggle = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
      active
        ? "bg-white/[0.14] text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)_inset,0_0_0_1px_rgba(255,255,255,0.1)]"
        : "text-[#C9DCEA] hover:bg-white/5"
    );
  const dotClass = (active: boolean) =>
    cn("h-1.5 w-1.5 rounded-full", active ? "bg-gradient-to-br from-accent-500 to-accent-600" : "bg-white/30");

  return (
    <>
      {/* Lớp phủ tối phía sau drawer — chỉ hiện trên di động lúc mở, bấm vào để đóng. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-brand-900 via-[#0A3D6E] to-brand-700 text-white shadow-[4px_0_24px_rgba(6,50,90,0.15)] transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
        {visibleNav.map((entity) => {
          if (!entity.children) {
            const active = isActive(entity.href);
            return (
              <Link key={entity.key} href={entity.href} className={linkClass(active)}>
                <span className={dotClass(active)} />
                {entity.label}
              </Link>
            );
          }

          const groupActive = entity.children.some((c) => isActive(c.href));
          const open = openKeys.has(entity.key);
          return (
            <div key={entity.key}>
              <button
                type="button"
                onClick={() => toggle(entity.key)}
                className={cn(linkClass(groupActive && !open), "w-full justify-between")}
              >
                <span className="flex items-center gap-2.5">
                  <span className={dotClass(groupActive)} />
                  {entity.label}
                </span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  className={cn("shrink-0 transition-transform", open && "rotate-180")}
                >
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {open && (
                <div className="ml-3.5 space-y-0.5 border-l border-white/10 pl-3">
                  {entity.children.map((child) => {
                    const active = isActive(child.href);
                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        className={cn(
                          "block rounded-[9px] px-3 py-2 text-[13px] font-medium transition-colors",
                          active ? "bg-white/[0.14] text-white" : "text-[#C9DCEA] hover:bg-white/5"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
    </>
  );
}
