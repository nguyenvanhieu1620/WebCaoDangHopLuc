/**
 * Xác minh Cloudflare Turnstile (chống spam/bot) — cùng tinh thần "dịch vụ
 * ngoài miễn phí, không bắt buộc" như DeepL/Resend/GA. Chưa cấu hình
 * `TURNSTILE_SECRET_KEY` thì bỏ qua kiểm tra (trả `true`), không được để
 * thiếu cấu hình làm hỏng luồng chính (form vẫn gửi được bình thường, chỉ
 * là chưa có lớp chống bot nâng cao — honeypot vẫn hoạt động độc lập).
 *
 * Đăng ký site miễn phí tại https://dash.cloudflare.com/?to=/:account/turnstile
 * (không cần domain thật để tạo — chọn "self-hosted"/điền domain tạm),
 * lấy Site Key (dán vào `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) và Secret Key
 * (dán vào `TURNSTILE_SECRET_KEY`) — xem CLAUDE.md mục 9.
 */
export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Cloudflare tạm không phản hồi được — chặn để an toàn hơn thay vì cho qua.
    return false;
  }
}
