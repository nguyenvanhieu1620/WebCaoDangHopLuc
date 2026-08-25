import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
};

export async function POST(request: Request) {
  if (!checkRateLimit(`contact:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
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

  const [created] = await db
    .insert(schema.contactMessages)
    .values({
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      message: body.message,
    })
    .returning();

  return NextResponse.json({ ok: true, message: "Đã gửi liên hệ.", id: created.id });
}
