/**
 * Gửi email qua Resend (https://resend.com) — free tier 3.000 email/tháng,
 * không cần thẻ tín dụng, cùng tinh thần "dịch vụ ngoài miễn phí, không bắt
 * buộc" như DeepL (xem src/lib/translate.ts).
 *
 * Chưa cấu hình `RESEND_API_KEY` thì im lặng bỏ qua (không throw) — không
 * được để thiếu cấu hình email làm hỏng luồng chính (đăng ký tuyển sinh,
 * gửi liên hệ, quên mật khẩu vẫn phải hoạt động dù chưa bật email).
 */

import { after } from "next/server";

/** Resend chậm/treo thì bỏ sau chừng này — không giữ request (và người dùng) chờ mãi. */
const SEND_TIMEOUT_MS = 8000;

/** Escape HTML cơ bản — dữ liệu người dùng nhập (họ tên, nội dung...) được chèn thẳng vào email HTML. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendEmailInput = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("Gửi email thất bại:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Gửi email lỗi:", err);
  }
}

/**
 * Gửi email báo admin SAU khi đã trả phản hồi cho người dùng (`after()` của Next) — người nộp hồ
 * sơ/liên hệ không phải chờ Resend. Gọi ngoài request (test, script) thì gửi luôn, không chờ.
 */
export function sendEmailAfterResponse(input: SendEmailInput): void {
  try {
    after(() => sendEmail(input));
  } catch {
    void sendEmail(input);
  }
}
