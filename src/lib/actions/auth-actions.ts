"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string };

/** Server Action xử lý submit form đăng nhập ở /admin/dang-nhap. */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." };
  }

  // Chặn dò mật khẩu (brute-force) — giới hạn theo IP lẫn theo email, vì
  // chỉ chặn theo IP thì 1 người dùng chung mạng (VD văn phòng) có thể vô
  // tình bị khoá lây khi người khác gõ sai nhiều lần.
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (
    !checkRateLimit(`login-ip:${ip}`, 20, 10 * 60 * 1000) ||
    !checkRateLimit(`login-email:${email}`, 5, 10 * 60 * 1000)
  ) {
    return { error: "Bạn thử sai quá nhiều lần, vui lòng đợi ít phút rồi thử lại." };
  }

  const user = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.email, email),
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Sai tài khoản hoặc mật khẩu." };
  }

  const sessionValue = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  redirect("/admin");
}

/** Server Action đăng xuất — xoá cookie session rồi chuyển về trang đăng nhập. */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/dang-nhap");
}
