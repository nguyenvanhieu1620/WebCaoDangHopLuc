import { count, eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileMenuProvider } from "@/components/admin/AdminMobileMenuContext";
import { AdminCommandPaletteProvider } from "@/components/admin/AdminCommandPalette";
import { requireAdmin, getUserPermissions, hasPermission } from "@/lib/admin-auth";
import { db, schema } from "@/lib/db";

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
 * `AdminCommandPaletteProvider` cung cấp bảng lệnh Ctrl+K cho mọi trang.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const permissions = getUserPermissions(user);

  // Badge số mục "mới" trên sidebar — chỉ đếm khi tài khoản có quyền module tương ứng.
  const badges: Record<string, number> = {};
  if (hasPermission(user, "admissions-contact")) {
    const [[admissions], [messages]] = await Promise.all([
      db.select({ value: count() }).from(schema.admissionSubmissions).where(eq(schema.admissionSubmissions.status, "new")),
      db.select({ value: count() }).from(schema.contactMessages).where(eq(schema.contactMessages.status, "new")),
    ]);
    badges["/admin/tuyen-sinh"] = admissions?.value ?? 0;
    badges["/admin/lien-he"] = messages?.value ?? 0;
  }

  return (
    <AdminMobileMenuProvider>
      <AdminCommandPaletteProvider permissions={permissions}>
        <div className="flex min-h-screen bg-paper">
          <AdminSidebar userName={user.name} permissions={permissions} badges={badges} />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </AdminCommandPaletteProvider>
    </AdminMobileMenuProvider>
  );
}
