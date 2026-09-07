import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { findOversizedField } from "@/lib/validate";

/**
 * API route cho form "Liên hệ" ở trang /lien-he.
 * Lưu thật vào bảng contact_messages — admin xem/đổi trạng thái qua admin/lien-he.
 */

type ContactPayload = {
  name: string;
  phone?: string;
  email?: string;
  message: string;
  /** Honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS, bot tự động điền form thường vẫn điền vào. */
  website?: string;
  /** Token Cloudflare Turnstile — chỉ có giá trị khi đã cấu hình NEXT_PUBLIC_TURNSTILE_SITE_KEY, xem src/lib/turnstile.ts. */
  turnstileToken?: string;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as Partial<ContactPayload>;

  if (body.website) {
    return NextResponse.json({ ok: true, message: "Đã gửi liên hệ.", id: "ignored" });
  }

  if (!body.name || !body.message) {
    return NextResponse.json(
      { ok: false, error: "Thiếu thông tin bắt buộc (họ tên, nội dung)." },
      { status: 400 }
    );
  }

  const oversizedField = findOversizedField({
    name: { value: body.name, max: 200 },
    phone: { value: body.phone || "", max: 30 },
    email: { value: body.email || "", max: 254 },
    message: { value: body.message, max: 5000 },
  });
  if (oversizedField) {
    return NextResponse.json({ ok: false, error: "Thông tin nhập vào quá dài." }, { status: 400 });
  }

  if (!(await verifyTurnstileToken(body.turnstileToken || "", ip))) {
    return NextResponse.json(
      { ok: false, error: "Xác minh chống spam thất bại, vui lòng thử lại." },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(schema.contactMessages)
    .values({
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      message: body.message,
    })
    .returning();

  const settings = await db.query.siteSettings.findFirst({
    where: (s, { eq }) => eq(s.id, "main"),
  });
  if (settings?.email) {
    await sendEmail({
      to: settings.email,
      subject: `Tin nhắn liên hệ mới — ${created.name}`,
      html: `<p><strong>Có tin nhắn liên hệ mới từ website:</strong></p>
        <ul>
          <li>Họ tên: ${escapeHtml(created.name)}</li>
          <li>Số điện thoại: ${created.phone ? escapeHtml(created.phone) : "(không có)"}</li>
          <li>Email: ${created.email ? escapeHtml(created.email) : "(không có)"}</li>
        </ul>
        <p>Nội dung: ${escapeHtml(created.message)}</p>
        <p>Xem chi tiết tại admin/lien-he.</p>`,
    });
  }

  return NextResponse.json({ ok: true, message: "Đã gửi liên hệ.", id: created.id });
}
