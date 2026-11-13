import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { toCsv, csvResponse, digitsCell } from "@/lib/csv";
import { formatDbDateTime, vnDateKey } from "@/lib/utils";
import { filterContactMessages, parseContactFilters } from "../filter";
import { contactStatusLabel } from "../status";

/** Tải tin nhắn liên hệ dạng CSV theo cùng bộ lọc với trang danh sách. */
export async function GET(request: Request) {
  await requirePermission("admissions-contact");
  const params = new URL(request.url).searchParams;
  const filters = parseContactFilters({ q: params.get("q"), status: params.get("status") });
  const all = await db.query.contactMessages.findMany({
    orderBy: [desc(schema.contactMessages.createdAt), desc(schema.contactMessages.seq)],
  });
  const rows = filterContactMessages(all, filters);

  const csv = toCsv(
    ["Họ tên", "Điện thoại", "Email", "Nội dung", "Trạng thái", "Ngày gửi"],
    rows.map((m) => [
      m.name,
      digitsCell(m.phone),
      m.email,
      m.message,
      contactStatusLabel(m.status),
      formatDbDateTime(m.createdAt),
    ])
  );
  const today = vnDateKey(new Date().toISOString()).replace(/-/g, "");
  return csvResponse(csv, `tin-nhan-lien-he-${today}.csv`);
}
