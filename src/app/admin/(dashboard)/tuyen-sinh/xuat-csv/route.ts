import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { toCsv, csvResponse, digitsCell } from "@/lib/csv";
import { formatDbDateTime, vnDateKey } from "@/lib/utils";
import { filterAdmissions, parseStatusFilter } from "../filter";

const STATUS_LABEL: Record<string, string> = { new: "Mới", reviewed: "Đã xem", contacted: "Đã liên hệ" };

/**
 * GET /admin/tuyen-sinh/xuat-csv?q=&status= — tải hồ sơ tuyển sinh dạng CSV
 * (mở bằng Excel). Áp dụng đúng bộ lọc đang chọn ở trang danh sách. Dữ liệu
 * cá nhân (CCCD, SĐT) nên chỉ tài khoản có quyền "admissions-contact" tải được
 * — `proxy.ts` chặn khi chưa đăng nhập, `requirePermission` chặn khi thiếu quyền.
 */
export async function GET(request: Request) {
  await requirePermission("admissions-contact");
  const url = new URL(request.url);
  const all = await db.query.admissionSubmissions.findMany({
    orderBy: desc(schema.admissionSubmissions.createdAt),
  });
  const rows = filterAdmissions(all, {
    q: url.searchParams.get("q") ?? undefined,
    status: parseStatusFilter(url.searchParams.get("status") ?? undefined),
  });

  const csv = toCsv(
    ["Họ tên", "Điện thoại", "CCCD", "Email", "Ngành quan tâm", "Ghi chú", "Trạng thái", "Ngày nộp"],
    rows.map((s) => [
      s.fullName,
      digitsCell(s.phone),
      digitsCell(s.idNumber),
      s.email,
      s.program,
      s.note,
      STATUS_LABEL[s.status] ?? s.status,
      formatDbDateTime(s.createdAt),
    ])
  );
  const today = vnDateKey(new Date().toISOString()).replace(/-/g, "");
  return csvResponse(csv, `ho-so-tuyen-sinh-${today}.csv`);
}
