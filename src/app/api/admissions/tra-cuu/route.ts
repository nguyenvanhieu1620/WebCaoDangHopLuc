import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

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

export async function POST(request: Request) {
  const body = (await request.json()) as { idNumber?: string };
  const idNumber = (body.idNumber || "").trim();

  if (!idNumber) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng nhập số CCCD đã đăng ký." },
      { status: 400 }
    );
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
