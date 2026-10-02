import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidEmail, readJsonObject, readStringFields } from "@/lib/validate";

/**
 * API route cho form "Đăng ký nhận tin" ở Footer. Lưu vào bảng
 * `newsletter_subscribers` — admin xem/xuất danh sách qua
 * admin/dang-ky-nhan-tin. Không gửi email báo cho admin mỗi lượt đăng ký
 * (khác /api/contact, /api/admissions) — đây không phải việc cần xử lý gấp,
 * admin xem danh sách khi cần là đủ.
 *
 * Payload (JSON object, mọi field là chuỗi):
 * - email: bắt buộc
 * - website: honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS.
 * - turnstileToken: token Cloudflare Turnstile — chỉ có giá trị khi đã cấu hình NEXT_PUBLIC_TURNSTILE_SITE_KEY, xem src/lib/turnstile.ts.
 */

const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút." },
      { status: 429 }
    );
  }

  const parsed = await readJsonObject(request, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }
  const body = parsed.data;

  if (body.website) {
    return NextResponse.json({ ok: true, message: "Đã đăng ký." });
  }

  const fields = readStringFields(body, {
    email: { label: "email", max: 254, required: true, lowercase: true },
    turnstileToken: { label: "mã xác minh", max: 4096 },
  });
  if (!fields.ok) {
    const error = fields.kind === "type" ? fields.error : "Email không hợp lệ.";
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const { email, turnstileToken } = fields.values;
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }

  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return NextResponse.json(
      { ok: false, error: "Xác minh chống spam thất bại, vui lòng thử lại." },
      { status: 400 }
    );
  }

  await db.insert(schema.newsletterSubscribers).values({ email })
    .onConflictDoNothing({ target: schema.newsletterSubscribers.email });

  return NextResponse.json({ ok: true, message: "Đăng ký thành công." });
}
