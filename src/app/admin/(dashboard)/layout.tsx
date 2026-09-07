import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileMenuProvider } from "@/components/admin/AdminMobileMenuContext";
import { getCurrentAdminUser, getUserPermissions } from "@/lib/admin-auth";

/**
 * Layout cho toàn bộ khu vực quản trị đã đăng nhập (route group "(dashboard)").
 * Trang đăng nhập (/admin/dang-nhap) nằm ngoài nhóm này nên không bị bọc sidebar.
 * Việc bắt buộc đăng nhập đã xử lý ở src/proxy.ts (chạy trước layout này) —
 * ở đây đọc user đầy đủ (qua `getCurrentAdminUser`, có cache theo request) để
 * lấy tên hiển thị + quyền, dùng lọc bớt mục sidebar mà tài khoản không có quyền.
 *
 * `AdminMobileMenuProvider` bọc ngoài cùng để `AdminSidebar` (ở đây) và
 * `AdminTopbar` (nằm sâu trong từng `page.tsx`) dùng chung 1 trạng thái
 * đóng/mở — cho phép sidebar chuyển thành drawer trượt trên di động thay vì
 * chiếm cứng 256px màn hình (xem AdminMobileMenuContext.tsx).
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminUser();
  const permissions = user ? getUserPermissions(user) : [];

  return (
    <AdminMobileMenuProvider>
      <div className="flex min-h-screen bg-paper">
        <AdminSidebar userName={user?.name ?? "Quản trị viên"} permissions={permissions} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AdminMobileMenuProvider>
  );
}
