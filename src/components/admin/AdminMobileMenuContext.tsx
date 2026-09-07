"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AdminMobileMenuContextValue = {
  mobileOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const AdminMobileMenuContext = createContext<AdminMobileMenuContextValue | null>(null);

/**
 * Chia sẻ trạng thái "sidebar mobile đang mở hay không" giữa `AdminSidebar`
 * (đọc để hiện/ẩn) và `AdminTopbar` (nút ☰ để bật) — 2 component này nằm ở
 * 2 nhánh khác nhau trong cây (`AdminSidebar` ở `layout.tsx`, `AdminTopbar`
 * nằm sâu trong từng `page.tsx`), nên cần Context thay vì truyền prop qua
 * hàng chục trang admin.
 */
export function AdminMobileMenuProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <AdminMobileMenuContext.Provider
      value={{
        mobileOpen,
        toggle: () => setMobileOpen((v) => !v),
        close: () => setMobileOpen(false),
      }}
    >
      {children}
    </AdminMobileMenuContext.Provider>
  );
}

export function useAdminMobileMenu(): AdminMobileMenuContextValue {
  const ctx = useContext(AdminMobileMenuContext);
  if (!ctx) throw new Error("useAdminMobileMenu phải dùng bên trong AdminMobileMenuProvider");
  return ctx;
}
