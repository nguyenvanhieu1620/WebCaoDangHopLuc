import type { AdmissionSubmission } from "@/lib/db/schema";
import { normalizeSearch } from "@/lib/utils";

export type AdmissionStatusFilter = "all" | "new" | "reviewed" | "contacted";

export function parseStatusFilter(status: string | undefined): AdmissionStatusFilter {
  return status === "new" || status === "reviewed" || status === "contacted" ? status : "all";
}

/**
 * Lọc hồ sơ theo trạng thái + từ khoá (tên/SĐT/CCCD/ngành, không phân biệt
 * dấu) — dùng chung cho trang danh sách và file Excel xuất ra, để "Xuất
 * Excel" luôn ra đúng những gì admin đang thấy trên màn hình.
 */
export function filterAdmissions(
  all: AdmissionSubmission[],
  { q, status }: { q?: string; status: AdmissionStatusFilter }
): AdmissionSubmission[] {
  const needle = q ? normalizeSearch(q) : "";
  return all.filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (needle && !normalizeSearch(`${s.fullName} ${s.phone} ${s.idNumber ?? ""} ${s.program}`).includes(needle)) {
      return false;
    }
    return true;
  });
}
