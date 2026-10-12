import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { toCsv, csvResponse, digitsCell } from "@/lib/csv";
import { formatDbDateTime, vnDateKey } from "@/lib/utils";

/** GET /admin/lien-he/xuat-csv?status= — tải tin nhắn liên hệ dạng CSV (mở bằng Excel), theo bộ lọc đang chọn. */
export async function GET(request: Request) {
  await requirePermission("admissions-contact");
  const status = new URL(request.url).searchParams.get("status");
  const all = await db.query.contactMessages.findMany({
    orderBy: [desc(schema.contactMessages.createdAt), desc(schema.contactMessages.seq)],
  });
  const rows = all.filter((m) => (status === "new" || status === "read" ? m.status === status : true));

  const csv = toCsv(
    ["Họ tên", "Điện thoại", "Email", "Nội dung", "Trạng thái", "Ngày gửi"],
    rows.map((m) => [
      m.name,
      digitsCell(m.phone),
      m.email,
      m.message,
      m.status === "new" ? "Mới" : "Đã xem",
      formatDbDateTime(m.createdAt),
    ])
  );
  const today = vnDateKey(new Date().toISOString()).replace(/-/g, "");
  return csvResponse(csv, `tin-nhan-lien-he-${today}.csv`);
}
