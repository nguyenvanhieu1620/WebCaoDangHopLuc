import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidCccd, normalizeCccd, readJsonObject, readStringFields } from "@/lib/validate";

/**
 * API tra cứu kết quả xét tuyển công khai ở /tra-cuu-ket-qua — nhập CCCD,
 * trả về trạng thái hồ sơ. Chỉ trả các trường không nhạy cảm (không trả số
 * điện thoại/email) để hạn chế lộ thông tin cá nhân qua tra cứu công khai.
 */

const STATUS_LABEL: Record<string, string> = {
  new: "Đã tiếp nhận, đang chờ xét duyệt",
  reviewed: "Đã xem xét hồ sơ",
  contacted: "Đã liên hệ trao đổi kết quả",
};

const MAX_BODY_BYTES = 2 * 1024;

export async function POST(request: Request) {
  // Giới hạn lỏng hơn form gửi dữ liệu vì tra cứu là thao tác đọc hợp lệ có
  // thể lặp lại, nhưng vẫn cần chặn dò quét số CCCD hàng loạt.
  if (!checkRateLimit(`lookup:${getClientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Bạn tra cứu quá nhiều lần, vui lòng thử lại sau ít phút." },
      { status: 429 }
    );
  }

  const parsed = await readJsonObject(request, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: parsed.status });
  }

  const fields = readStringFields(parsed.data, {
    idNumber: { label: "số CCCD", max: 50, required: true },
  });
  if (!fields.ok) {
    const error = fields.kind === "missing" ? "Vui lòng nhập số CCCD đã đăng ký." : fields.error;
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const idNumber = normalizeCccd(fields.values.idNumber);
  if (!isValidCccd(idNumber)) {
    return NextResponse.json({ ok: false, error: "Số CCCD phải gồm đúng 12 chữ số." }, { status: 400 });
  }

  const rows = await db.query.admissionSubmissions.findMany({
    where: eq(schema.admissionSubmissions.idNumber, idNumber),
  });

  return NextResponse.json({
    ok: true,
    results: rows.map((r) => ({
      fullName: r.fullName,
      program: r.program,
      statusLabel: STATUS_LABEL[r.status] ?? r.status,
      createdAt: r.createdAt,
    })),
  });
}
