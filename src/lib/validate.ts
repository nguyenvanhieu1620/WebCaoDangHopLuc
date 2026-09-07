/**
 * Kiểm tra độ dài field text nhận từ request công khai (form tuyển sinh,
 * liên hệ, newsletter, tra cứu...) — chặn payload bất thường dài (VD 1
 * field "note" dài hàng MB) trước khi ghi vào DB. Rate limit theo IP đã
 * giới hạn SỐ LẦN gửi, nhưng không giới hạn KÍCH THƯỚC mỗi lần gửi — 2 lớp
 * này bổ sung cho nhau.
 */
export function findOversizedField(fields: Record<string, { value: string; max: number }>): string | null {
  for (const [name, { value, max }] of Object.entries(fields)) {
    if (value.length > max) return name;
  }
  return null;
}
