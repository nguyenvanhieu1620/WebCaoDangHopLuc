import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * API route cho form "Đăng ký nhận tin" ở Footer. Lưu vào bảng
 * `newsletter_subscribers` — admin xem/xuất danh sách qua
 * admin/dang-ky-nhan-tin. Không gửi email báo cho admin mỗi lượt đăng ký
 * (khác /api/contact, /api/admissions) — đây không phải việc cần xử lý gấp,
 * admin xem danh sách khi cần là đủ.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type NewsletterPayload = {
  email: string;
  /** Honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS. */
  website?: string;
};

export async function POST(request: Request) {
  if (!checkRateLimit(`newsletter:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as Partial<NewsletterPayload>;

  if (body.website) {
    return NextResponse.json({ ok: true, message: "Đã đăng ký." });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }

  const existing = await db.query.newsletterSubscribers.findFirst({
    where: (n, { eq }) => eq(n.email, email),
  });
  if (!existing) {
    await db.insert(schema.newsletterSubscribers).values({ email });
  }

  return NextResponse.json({ ok: true, message: "Đăng ký thành công." });
}
