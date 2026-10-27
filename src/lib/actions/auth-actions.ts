"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, credentialVersion, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/auth";
import { checkRateLimit, getClientIp, isRateLimited, resetRateLimit } from "@/lib/rate-limit";
import { DEMO_ADMIN_PASSWORD } from "@/lib/demo-credentials";

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
  // Email dùng làm khoá đếm số lần thử (bộ nhớ) — chặn chuỗi dài bất thường, email thật ≤ 254 ký tự.
  if (email.length > 254 || password.length > 256) {
    return { error: "Sai tài khoản hoặc mật khẩu." };
  }

  // Chỉ đếm xác thực thất bại; giới hạn theo email và IP xác định được.
  const headerStore = await headers();
  const ip = getClientIp({ headers: headerStore });
  // IP khác không thể dùng email đã biết để khoá việc đăng nhập của chủ tài khoản.
  const emailKey = `login-email:${ip}:${email}`;
  const ipKey = `login-ip:${ip}`;
  if (
    (ip !== "unknown" && isRateLimited(ipKey, 20)) ||
    isRateLimited(emailKey, 5)
  ) {
    return { error: "Bạn thử sai quá nhiều lần, vui lòng đợi ít phút rồi thử lại." };
  }

  const user = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.email, email),
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    checkRateLimit(emailKey, 5, 10 * 60 * 1000);
    // An unidentified IP must not lock every administrator into one bucket.
    if (ip !== "unknown") checkRateLimit(ipKey, 20, 10 * 60 * 1000);
    return { error: "Sai tài khoản hoặc mật khẩu." };
  }

  resetRateLimit(emailKey);

  // Môi trường thật không bao giờ chấp nhận mật khẩu mẫu ai cũng biết (VD tài khoản mẫu theo
  // bản sao DB dev lên VPS) — phải đặt mật khẩu mới qua "Quên mật khẩu" hoặc admin khác.
  if (process.env.NODE_ENV === "production" && password === DEMO_ADMIN_PASSWORD) {
    return {
      error:
        "Tài khoản đang dùng mật khẩu mẫu, không được phép trên web thật. Hãy đặt lại mật khẩu qua \"Quên mật khẩu\".",
    };
  }

  const sessionValue = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    credentialVersion: credentialVersion(user.passwordHash),
  });

  const cookieStore = await cookies();
  if (process.env.NODE_ENV === "production") cookieStore.delete("hopluc_admin_session");
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
  // Cookie __Host- chỉ được trình duyệt chấp nhận (kể cả xoá) khi có Secure và Path=/.
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  redirect("/admin/dang-nhap");
}
