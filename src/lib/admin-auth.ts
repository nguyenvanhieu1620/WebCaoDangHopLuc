import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { verifySession, isCredentialCurrent, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { AdminUser } from "@/lib/db/schema";
import { hasPermission } from "@/lib/admin-permissions";
export { getUserPermissions, hasPermission } from "@/lib/admin-permissions";

/**
 * Lớp phân quyền theo module cho khu vực admin — mỗi tài khoản có
 * `permissions` là mảng JSON các module key (xem `PERMISSION_MODULES` trong
 * `src/lib/constants.ts`, lấy thẳng từ `ADMIN_NAV`). `permissions === null`
 * nghĩa là toàn quyền (mọi tài khoản có từ trước khi tính năng này ra đời
 * đều giữ `NULL` qua migration, không tự nhiên bị khoá quyền).
 *
 * Dùng `requirePermission(moduleKey)` ở đầu MỌI trang admin cần giới hạn
 * quyền — cùng logic cũng nên gọi lại trong `actions.ts` tương ứng vì
 * Server Action gọi được trực tiếp, không chỉ qua render trang.
 */

/** Đọc user admin hiện tại từ session — dùng `cache()` để 1 request chỉ query DB đúng 1 lần dù nhiều nơi cùng gọi. */
export const getCurrentAdminUser = cache(async (): Promise<AdminUser | null> => {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;
  const user = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.id, session.userId),
  });
  return user && isCredentialCurrent(session, user.passwordHash) ? user : null;
});

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdminUser();
  if (!user) redirect("/admin/dang-nhap");
  return user;
}

/**
 * Chặn truy cập nếu user hiện tại không có quyền `moduleKey` — gọi ở đầu
 * page.tsx/actions.ts. Chưa đăng nhập thì về trang đăng nhập (thực ra
 * `src/proxy.ts` đã chặn trước, đây chỉ là lớp phòng thủ thứ 2); có đăng
 * nhập nhưng thiếu quyền thì về Dashboard.
 */
export async function requirePermission(moduleKey: string): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!hasPermission(user, moduleKey)) redirect("/admin?khong_co_quyen=1");
  return user;
}
