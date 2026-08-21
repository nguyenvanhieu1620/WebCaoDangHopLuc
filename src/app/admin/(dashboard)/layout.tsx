import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Layout cho toàn bộ khu vực quản trị đã đăng nhập (route group "(dashboard)").
 * Trang đăng nhập (/admin/dang-nhap) nằm ngoài nhóm này nên không bị bọc sidebar.
 * Việc bắt buộc đăng nhập đã xử lý ở src/proxy.ts (chạy trước layout này) —
 * ở đây chỉ đọc session để hiển thị tên người dùng, không cần validate lại.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar userName={session?.name ?? "Quản trị viên"} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
