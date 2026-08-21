"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/auth";

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
