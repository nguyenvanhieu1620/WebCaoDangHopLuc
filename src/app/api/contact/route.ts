import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidEmail, isValidVnPhone, normalizeVnPhone, readJsonObject, readStringFields } from "@/lib/validate";

/**
 * API route cho form "Liên hệ" ở trang /lien-he.
 * Lưu thật vào bảng contact_messages — admin xem/đổi trạng thái qua admin/lien-he.
 *
 * Payload (JSON object, mọi field là chuỗi):
 * - name, message: bắt buộc
 * - phone, email: tuỳ chọn
 * - website: honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS, bot tự động điền form thường vẫn điền vào.
 * - turnstileToken: token Cloudflare Turnstile — chỉ có giá trị khi đã cấu hình NEXT_PUBLIC_TURNSTILE_SITE_KEY, xem src/lib/turnstile.ts.
 */

const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
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
    return NextResponse.json({ ok: true, message: "Đã gửi liên hệ.", id: "ignored" });
  }

  const fields = readStringFields(body, {
    name: { label: "họ tên", max: 200, required: true },
    phone: { label: "số điện thoại", max: 30 },
    email: { label: "email", max: 254, lowercase: true },
    message: { label: "nội dung", max: 5000, required: true },
    turnstileToken: { label: "mã xác minh", max: 4096 },
  });
  if (!fields.ok) {
    const error = fields.kind === "missing" ? "Thiếu thông tin bắt buộc (họ tên, nội dung)." : fields.error;
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const { name, email, message, turnstileToken } = fields.values;
  const phone = normalizeVnPhone(fields.values.phone);

  if (phone && !isValidVnPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0, hoặc dạng +84)." },
      { status: 400 }
    );
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Email không hợp lệ." }, { status: 400 });
  }

  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return NextResponse.json(
      { ok: false, error: "Xác minh chống spam thất bại, vui lòng thử lại." },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(schema.contactMessages)
    .values({
      name,
      phone: phone || null,
      email: email || null,
      message,
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
