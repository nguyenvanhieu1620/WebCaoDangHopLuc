/**
 * Gộp className có điều kiện, bỏ qua giá trị falsy.
 * Dùng thay cho clsx để không thêm dependency ngoài.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Tạo slug từ tiêu đề tiếng Việt — bỏ dấu, thay khoảng trắng bằng gạch ngang. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Múi giờ Việt Nam cố định UTC+7 (không có giờ mùa hè) — dùng xuyên suốt để ngày/giờ hiển thị không phụ thuộc múi giờ máy chủ đang chạy. */
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET_MINUTES = 7 * 60;

/** Định dạng ngày kiểu Việt Nam (dd/mm/yyyy) từ chuỗi ISO — trả về "" nếu rỗng. */
export function formatVNDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", { timeZone: VN_TIME_ZONE });
}

/** Định dạng ngày giờ kiểu Việt Nam (dd/mm/yyyy HH:mm) từ chuỗi ISO — dùng cho Sự kiện. */
export function formatVNDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { timeZone: VN_TIME_ZONE })} · ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: VN_TIME_ZONE })}`;
}

/**
 * Chuyển giá trị <input type="datetime-local"> (người dùng nhập theo giờ
 * Việt Nam, chuỗi không có offset — VD "2026-09-15T09:00") sang ISO UTC thật
 * để lưu DB. Tính thủ công theo offset cố định UTC+7 — không phụ thuộc múi
 * giờ máy chủ đang chạy (khác `new Date(value).toISOString()`, vốn hiểu
 * chuỗi không offset theo giờ LOCAL CỦA MÁY CHỦ, sai nếu server không đặt
 * múi giờ Việt Nam, VD deploy lên cloud mặc định UTC).
 */
export function vnDatetimeLocalToISO(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart || "00:00").split(":").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - VN_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs).toISOString();
}

/** Chiều ngược lại của `vnDatetimeLocalToISO` — dùng để tự điền giá trị vào <input type="datetime-local"> lúc hiện form Sửa. */
export function isoToVnDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const vnMs = new Date(iso).getTime() + VN_OFFSET_MINUTES * 60 * 1000;
  const d = new Date(vnMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}
