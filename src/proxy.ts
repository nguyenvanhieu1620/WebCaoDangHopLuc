import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Bảo vệ toàn bộ khu vực /admin (trừ trang đăng nhập): nếu chưa có session
 * hợp lệ, chuyển hướng về /admin/dang-nhap.
 * Chạy ở Node.js runtime (mặc định của Proxy trong Next.js 16) nên
 * verifySession() có thể dùng thẳng module "node:crypto" (HMAC, timingSafeEqual).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const PUBLIC_ADMIN_PATHS = ["/admin/dang-nhap", "/admin/quen-mat-khau", "/admin/dat-lai-mat-khau"];
  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.includes(pathname);
  const isAdminArea = pathname.startsWith("/admin");

  if (isAdminArea && !isPublicAdminPage) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = verifySession(cookie);

    if (!session) {
      const loginUrl = new URL("/admin/dang-nhap", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
