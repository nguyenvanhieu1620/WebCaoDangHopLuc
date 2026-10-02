import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, escapeHtml } from "@/lib/email";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  isValidCccd,
  isValidEmail,
  isValidVnPhone,
  normalizeCccd,
  normalizeVnPhone,
  readJsonObject,
  readStringFields,
} from "@/lib/validate";

/**
 * API route cho form "Đăng ký xét tuyển" ở trang /tuyen-sinh.
 * Lưu thật vào bảng admission_submissions (SQLite hiện tại — Aurora Postgres sau này).
 *
 * Payload (JSON object, mọi field là chuỗi):
 * - fullName, phone, idNumber, program: bắt buộc
 * - email, note: tuỳ chọn
 * - website: honeypot chống bot — field ẩn khỏi người dùng thật bằng CSS, bot tự động điền form thường vẫn điền vào.
 * - turnstileToken: token Cloudflare Turnstile — chỉ có giá trị khi đã cấu hình NEXT_PUBLIC_TURNSTILE_SITE_KEY, xem src/lib/turnstile.ts.
 */

const MAX_BODY_BYTES = 32 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admissions:${ip}`, 5, 10 * 60 * 1000)) {
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

  // Honeypot có giá trị → gần như chắc chắn là bot. Giả vờ thành công để
  // không lộ cho bot biết bị chặn, nhưng không ghi gì vào DB.
  if (body.website) {
    return NextResponse.json({ ok: true, message: "Đã nhận hồ sơ đăng ký.", id: "ignored" });
  }

  const fields = readStringFields(body, {
    fullName: { label: "họ tên", max: 200, required: true },
    phone: { label: "số điện thoại", max: 30, required: true },
    idNumber: { label: "số CCCD", max: 50, required: true },
    email: { label: "email", max: 254, lowercase: true },
    program: { label: "ngành đăng ký", max: 200, required: true },
    note: { label: "ghi chú", max: 3000 },
    turnstileToken: { label: "mã xác minh", max: 4096 },
  });
  if (!fields.ok) {
    const error =
      fields.kind === "missing" ? "Thiếu thông tin bắt buộc (họ tên, số điện thoại, CCCD, ngành)." : fields.error;
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const { fullName, email, note, turnstileToken } = fields.values;
  const phone = normalizeVnPhone(fields.values.phone);
  const idNumber = normalizeCccd(fields.values.idNumber);

  if (!isValidVnPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 0, hoặc dạng +84)." },
      { status: 400 }
    );
  }
  if (!isValidCccd(idNumber)) {
    return NextResponse.json({ ok: false, error: "Số CCCD phải gồm đúng 12 chữ số." }, { status: 400 });
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

  // Form hiện tên ngành theo ngôn ngữ đang chọn (getPrograms() resolve locale),
  // nên ở chế độ EN giá trị gửi lên là name_en — chấp nhận cả 2, luôn lưu tên
  // tiếng Việt gốc để admin xem thống nhất.
  const program = await db.query.programs.findFirst({
    columns: { name: true },
    where: or(eq(schema.programs.slug, fields.values.program), eq(schema.programs.name, fields.values.program), eq(schema.programs.nameEn, fields.values.program)),
  });
  if (!program) {
    return NextResponse.json({ ok: false, error: "Ngành đăng ký không tồn tại." }, { status: 400 });
  }

  const [created] = await db
    .insert(schema.admissionSubmissions)
    .values({
      fullName,
      phone,
      idNumber,
      email: email || null,
      program: program.name,
      note: note || null,
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
