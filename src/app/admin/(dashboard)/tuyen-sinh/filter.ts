import type { AdmissionSubmission } from "@/lib/db/schema";
import { normalizeSearch, dbTimestampToISO, vnDateKey } from "@/lib/utils";
import { isValidVnPhone, normalizeVnPhone } from "@/lib/validate";

export type AdmissionStatusFilter = "all" | "new" | "reviewed" | "contacted";
export type AdmissionFilters = { q?: string; status: AdmissionStatusFilter; program?: string; from?: string; to?: string };

/** Bỏ qua ngày không hợp lệ; ngày lọc tính theo giờ Việt Nam giống bảng/CSV. */
export function parseDateFilter(value?: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : "";
}

export function parseStatusFilter(status: string | undefined): AdmissionStatusFilter {
  return status === "new" || status === "reviewed" || status === "contacted" ? status : "all";
}

function localPhoneNumber(phone: string): string {
  return phone.startsWith("+84") && isValidVnPhone(phone) ? `0${phone.slice(3)}` : phone;
}

/**
 * Lọc hồ sơ theo trạng thái + từ khoá (tên/SĐT/CCCD/ngành, không phân biệt
 * dấu) — dùng chung cho trang danh sách và file Excel xuất ra, để "Xuất
 * Excel" luôn ra đúng những gì admin đang thấy trên màn hình.
 */
export function filterAdmissions(
  all: AdmissionSubmission[],
  { q, status, program, from, to }: AdmissionFilters
): AdmissionSubmission[] {
  const needle = q ? normalizeSearch(q) : "";
  const compact = normalizeVnPhone(needle);
  const numericQuery = /^\+?\d+$/.test(compact) ? compact : "";
  const phoneQuery = localPhoneNumber(numericQuery);
  const start = parseDateFilter(from);
  const end = parseDateFilter(to);
  return all.filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (program && s.program !== program) return false;
    if (start || end) {
      const day = vnDateKey(dbTimestampToISO(s.createdAt));
      if ((start && day < start) || (end && day > end)) return false;
    }
    if (!needle) return true;
    const searchableText = normalizeSearch(`${s.fullName} ${s.phone} ${s.idNumber ?? ""} ${s.program}`);
    if (searchableText.includes(needle)) return true;
    if (!numericQuery) return false;

    const phone = normalizeVnPhone(s.phone);
    const idNumber = normalizeVnPhone(s.idNumber ?? "");
    return phone.includes(numericQuery) || localPhoneNumber(phone).includes(phoneQuery) || idNumber.includes(numericQuery);
  });
}
