import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

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
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AdmissionPayload>;

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

  return NextResponse.json({ ok: true, message: "Đã nhận hồ sơ đăng ký.", id: created.id });
}
