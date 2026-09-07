import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { findOversizedField } from "@/lib/validate";

/**
 * API route cho form "Đăng ký xét tuyển" ở trang /tuyen-sinh.
 * Lưu thật vào bảng admission_submissions (SQLite hiện tại — Aurora Postgres sau này).
 */

type AdmissionPayload = {
  fullName: string;
  phone: string;
  idNumber: string;
  email?: string;
  program: string;
  note?: string;
  /** Honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS, bot tự động điền form thường vẫn điền vào. */
  website?: string;
  /** Token Cloudflare Turnstile — chỉ có giá trị khi đã cấu hình NEXT_PUBLIC_TURNSTILE_SITE_KEY, xem src/lib/turnstile.ts. */
  turnstileToken?: string;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admissions:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as Partial<AdmissionPayload>;

  // Honeypot có giá trị → gần như chắc chắn là bot. Giả vờ thành công để
  // không lộ cho bot biết bị chặn, nhưng không ghi gì vào DB.
  if (body.website) {
    return NextResponse.json({ ok: true, message: "Đã nhận hồ sơ đăng ký.", id: "ignored" });
  }

  if (!body.fullName || !body.phone || !body.idNumber || !body.program) {
    return NextResponse.json(
      { ok: false, error: "Thiếu thông tin bắt buộc (họ tên, số điện thoại, CCCD, ngành)." },
      { status: 400 }
    );
  }

  const oversizedField = findOversizedField({
    fullName: { value: body.fullName, max: 200 },
    phone: { value: body.phone, max: 30 },
    idNumber: { value: body.idNumber, max: 50 },
    email: { value: body.email || "", max: 254 },
    program: { value: body.program, max: 200 },
    note: { value: body.note || "", max: 3000 },
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
    .insert(schema.admissionSubmissions)
    .values({
      fullName: body.fullName,
      phone: body.phone,
      idNumber: body.idNumber,
      email: body.email || null,
      program: body.program,
      note: body.note || null,
    })
    .returning();

  const settings = await db.query.siteSettings.findFirst({
    where: (s, { eq }) => eq(s.id, "main"),
  });
  if (settings?.email) {
    await sendEmail({
      to: settings.email,
      subject: `Hồ sơ tuyển sinh mới — ${created.fullName}`,
      html: `<p><strong>Có hồ sơ đăng ký xét tuyển mới từ website:</strong></p>
        <ul>
          <li>Họ tên: ${escapeHtml(created.fullName)}</li>
          <li>Số điện thoại: ${escapeHtml(created.phone)}</li>
          <li>Số CCCD: ${created.idNumber ? escapeHtml(created.idNumber) : "(không có)"}</li>
          <li>Email: ${created.email ? escapeHtml(created.email) : "(không có)"}</li>
          <li>Ngành quan tâm: ${escapeHtml(created.program)}</li>
          ${created.note ? `<li>Ghi chú: ${escapeHtml(created.note)}</li>` : ""}
        </ul>
        <p>Xem chi tiết tại admin/tuyen-sinh.</p>`,
    });
  }

  return NextResponse.json({ ok: true, message: "Đã nhận hồ sơ đăng ký.", id: created.id });
}
