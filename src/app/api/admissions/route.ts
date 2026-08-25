import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";

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
};

export async function POST(request: Request) {
  if (!checkRateLimit(`admissions:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
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
