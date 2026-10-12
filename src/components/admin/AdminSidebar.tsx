"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_NAV, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth-actions";
import { useAdminMobileMenu } from "@/components/admin/AdminMobileMenuContext";
import { useCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminIcon } from "@/components/admin/AdminIcon";

type AdminSidebarProps = {
  userName: string;
  /** Danh sách module được phép truy cập — `null` = toàn quyền (hiện hết). */
  permissions: string[] | null;
  /** Số mục "mới" cần xử lý theo href trang con (VD hồ sơ tuyển sinh mới) — hiện thành badge đỏ. */
  badges?: Record<string, number>;
};

function Badge({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="ml-auto min-w-[20px] rounded-full bg-accent-500 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold leading-none text-white">
      {value > 99 ? "99+" : value}
    </span>
  );
}

/**
 * Sidebar dùng chung cho toàn bộ trang trong khu vực quản trị (CMS).
 * Mỗi mục trong ADMIN_NAV là 1 thực thể — có `children` thì hiện dạng khối
 * thu gọn/mở rộng được (header chỉ để bấm đóng/mở, không phải link), không
 * có `children` thì là link thẳng. Khối chứa trang đang mở tự động mở sẵn.
 * Các entity liền kề cùng `section` có 1 tiêu đề nhóm nhỏ phía trên (chỉ để
 * dễ nhìn, không đổi cấu trúc thực thể). "Dashboard" luôn hiện — các mục còn
 * lại lọc theo `permissions` (xem `src/lib/admin-auth.ts`).
 */
export function AdminSidebar({ userName, permissions, badges = {} }: AdminSidebarProps) {
  const pathname = usePathname();
  const { mobileOpen, close } = useAdminMobileMenu();
  const palette = useCommandPalette();
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
      "group flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-semibold transition-colors",
      active
        ? "bg-white/[0.14] text-white shadow-[0_2px_10px_rgba(0,0,0,0.15)_inset,0_0_0_1px_rgba(255,255,255,0.1)]"
        : "text-[#C9DCEA] hover:bg-white/5 hover:text-white"
    );
  const iconWrap = (active: boolean) =>
    cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
      active ? "bg-gradient-to-br from-accent-600 to-accent-500 text-white shadow-red" : "bg-white/[0.06] text-[#9FC3E0] group-hover:text-white"
    );
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
        <Link href="/admin" className="flex flex-col items-start gap-1.5 border-b border-white/10 px-5 py-5">
          {/* Logo đúng màu gốc trên ô trắng — sidebar nền xanh đậm. */}
          <span className="rounded-lg bg-white px-2.5 py-1.5">
            <Image
              src="/images/logo.png"
              alt={SITE.fullName}
              width={1137}
              height={315}
              sizes="160px"
              className="h-9 w-auto"
            />
          </span>
          <div className="font-mono text-[8.5px] uppercase tracking-wider text-accent-500">
            CMS Admin
          </div>
        </Link>

        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={palette.open}
            className="flex w-full items-center gap-2.5 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-[13px] text-[#9FC3E0] transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <AdminIcon name="search" className="h-4 w-4" />
            <span className="flex-1">Tìm nhanh…</span>
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[9.5px]">Ctrl K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2" aria-label="Menu quản trị">
          {visibleNav.map((entity, index) => {
            const showSection = !!entity.section && visibleNav[index - 1]?.section !== entity.section;
            const sectionLabel = showSection && (
              <div className="px-3 pb-1.5 pt-4 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#7FA8C9]">
                {entity.section}
              </div>
            );

            if (!entity.children) {
              const active = isActive(entity.href);
              return (
                <div key={entity.key}>
                  {sectionLabel}
                  <Link href={entity.href} className={cn(linkClass(active), "mt-0.5")} aria-current={active ? "page" : undefined}>
                    <span className={iconWrap(active)}>
                      <AdminIcon name={entity.key} className="h-4 w-4" />
                    </span>
                    {entity.label}
                    <Badge value={badges[entity.href]} />
                  </Link>
                </div>
              );
            }

            const groupActive = entity.children.some((c) => isActive(c.href));
            const open = openKeys.has(entity.key);
            const groupBadge = entity.children.reduce((sum, c) => sum + (badges[c.href] ?? 0), 0);
            return (
              <div key={entity.key}>
                {sectionLabel}
                <button
                  type="button"
                  onClick={() => toggle(entity.key)}
                  aria-expanded={open}
                  className={cn(linkClass(groupActive && !open), "mt-0.5 w-full")}
                >
                  <span className={iconWrap(groupActive)}>
                    <AdminIcon name={entity.key} className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-left">{entity.label}</span>
                  {!open && <Badge value={groupBadge} />}
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className={cn("ml-1 shrink-0 transition-transform", open && "rotate-180")}
                  >
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                {open && (
                  <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {entity.children.map((child) => {
                      const active = isActive(child.href);
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors",
                            active ? "bg-white/[0.14] text-white" : "text-[#C9DCEA] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {child.label}
                          <Badge value={badges[child.href]} />
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
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13px] font-semibold">{userName}</div>
            <div className="text-[11px] text-[#9FC3E0]">{permissions === null ? "Toàn quyền" : "Biên tập viên"}</div>
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
