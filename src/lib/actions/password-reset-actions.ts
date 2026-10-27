"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { hashPassword, signResetToken, verifyResetToken, isCredentialCurrent } from "@/lib/auth";
import { escapeHtml } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmailAfterResponse } from "@/lib/email";
import { DEMO_ADMIN_PASSWORD } from "@/lib/demo-credentials";
import { SITE, SITE_URL } from "@/lib/constants";

export type RequestResetState = { message?: string; error?: string };
export type ResetPasswordState = { error?: string };

/**
 * Bước 1 — nhập email, gửi link đặt lại mật khẩu nếu tài khoản tồn tại.
 * Luôn trả về đúng 1 thông điệp chung dù email có tồn tại hay không, tránh
 * lộ cho kẻ dò quét biết email nào đang là tài khoản admin thật (user
 * enumeration).
 */
export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const GENERIC_MESSAGE =
    "Nếu email này có tài khoản trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi tới hộp thư.";

  if (!email) {
    return { error: "Vui lòng nhập email." };
  }
  // Email dùng làm khoá đếm số lần gửi (bộ nhớ) — email thật ≤ 254 ký tự; trả đúng thông điệp chung.
  if (email.length > 254) return { message: GENERIC_MESSAGE };

  const headerStore = await headers();
  const ip = getClientIp({ headers: headerStore });
  if (
    !checkRateLimit(`reset-req-ip:${ip}`, 10, 10 * 60 * 1000) ||
    !checkRateLimit(`reset-req-email:${email}`, 3, 10 * 60 * 1000)
  ) {
    return { error: "Bạn yêu cầu quá nhiều lần, vui lòng đợi ít phút rồi thử lại." };
  }

  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  if (user) {
    const token = signResetToken(user.id, user.passwordHash, user.email);
    const resetLink = `${SITE_URL}/admin/dat-lai-mat-khau?token=${token}`;
    sendEmailAfterResponse({
      to: user.email,
      subject: `Đặt lại mật khẩu quản trị — ${SITE.name}`,
      html: `<p>Xin chào ${escapeHtml(user.name)},</p>
        <p>Có yêu cầu đặt lại mật khẩu cho tài khoản quản trị của bạn. Bấm vào liên kết dưới đây để đặt mật khẩu mới (liên kết có hiệu lực trong 30 phút):</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Nếu bạn không yêu cầu việc này, có thể bỏ qua email này — mật khẩu hiện tại vẫn không đổi.</p>`,
    });
  }

  return { message: GENERIC_MESSAGE };
}

/** Bước 2 — xác minh token, đặt mật khẩu mới. */
export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    return { error: "Liên kết không hợp lệ." };
  }
  if (password.length < 8) {
    return { error: "Mật khẩu cần tối thiểu 8 ký tự." };
  }
  if (password.length > 256) return { error: "Mật khẩu không được vượt quá 256 ký tự." };
  if (password === DEMO_ADMIN_PASSWORD) {
    return { error: "Không dùng lại mật khẩu mẫu — hãy chọn mật khẩu khác." };
  }
  if (password !== confirmPassword) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  const payload = verifyResetToken(token);
  if (!payload) {
    return { error: "Liên kết đã hết hạn hoặc không hợp lệ — yêu cầu gửi lại liên kết mới." };
  }

  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, payload.userId) });
  if (!user) {
    return { error: "Không tìm thấy tài khoản." };
  }

  if (payload.email !== user.email || !isCredentialCurrent(payload, user.passwordHash)) {
    return { error: "Liên kết đã được sử dụng hoặc mật khẩu đã thay đổi — yêu cầu liên kết mới." };
  }

  const changed = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(password) })
    .where(and(eq(schema.adminUsers.id, user.id), eq(schema.adminUsers.passwordHash, user.passwordHash), eq(schema.adminUsers.email, payload.email)))
    .returning({ id: schema.adminUsers.id });

  if (!changed.length) return { error: "Mật khẩu đã thay đổi — vui lòng yêu cầu liên kết mới." };

  redirect("/admin/dang-nhap?reset=1");
}
