/**
 * Kiểm tra dữ liệu nhận từ request công khai (form tuyển sinh, liên hệ,
 * newsletter, tra cứu...). Mục tiêu: dữ liệu sai định dạng/sai kiểu luôn trả
 * 400 (hoặc 413 nếu quá lớn) có thông báo tiếng Việt, không bao giờ để lọt
 * thành lỗi 500. Rate limit theo IP đã giới hạn SỐ LẦN gửi, còn file này giới
 * hạn KÍCH THƯỚC + KIỂU dữ liệu mỗi lần gửi — 2 lớp bổ sung cho nhau.
 *
 * Cố ý không import gì từ Next.js/DB để test độc lập được bằng node:test.
 */

export type JsonObject = Record<string, unknown>;

export type ReadJsonResult =
  | { ok: true; data: JsonObject }
  | { ok: false; status: 400 | 413; error: string };

const TOO_LARGE_ERROR = "Dữ liệu gửi lên quá lớn.";
const INVALID_JSON_ERROR = "Dữ liệu gửi lên không đúng định dạng JSON.";
const NOT_OBJECT_ERROR = "Dữ liệu gửi lên không hợp lệ.";

/**
 * Đọc body JSON dạng object an toàn: chặn body vượt `maxBytes` (413) kể cả khi
 * client không gửi/gửi sai Content-Length (đếm byte thật trong lúc đọc stream,
 * dừng ngay khi vượt), JSON hỏng hoặc không phải object (null, mảng, số,
 * chuỗi...) trả 400.
 */
export async function readJsonObject(request: Request, maxBytes: number): Promise<ReadJsonResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (Number.isFinite(length) && length > maxBytes) {
      return { ok: false, status: 413, error: TOO_LARGE_ERROR };
    }
  }

  let text: string;
  try {
    const read = await readBodyText(request, maxBytes);
    if (read === null) return { ok: false, status: 413, error: TOO_LARGE_ERROR };
    text = read;
  } catch {
    return { ok: false, status: 400, error: INVALID_JSON_ERROR };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: INVALID_JSON_ERROR };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: NOT_OBJECT_ERROR };
  }
  return { ok: true, data: parsed as JsonObject };
}

/** Trả về null nếu body vượt `maxBytes`. */
async function readBodyText(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

export type StringFieldRule = {
  /** Tên field bằng tiếng Việt, dùng trong thông báo lỗi. */
  label: string;
  /** Độ dài tối đa (ký tự) sau khi trim. */
  max: number;
  required?: boolean;
  lowercase?: boolean;
};

export type ReadFieldsResult<K extends string> =
  | { ok: true; values: Record<K, string> }
  | { ok: false; kind: "type" | "missing" | "tooLong"; field: K; error: string };

/**
 * Đọc nhiều field chuỗi từ body đã parse: trim, lowercase nếu cần, kiểm tra
 * kiểu + bắt buộc + độ dài. Field không gửi lên (undefined) coi như chuỗi
 * rỗng; mọi kiểu khác chuỗi (null, số, mảng, object...) đều là lỗi kiểu.
 * Field tuỳ chọn để trống được chấp nhận (trả về "").
 */
export function readStringFields<K extends string>(
  body: JsonObject,
  rules: Record<K, StringFieldRule>
): ReadFieldsResult<K> {
  const values = {} as Record<K, string>;
  for (const field of Object.keys(rules) as K[]) {
    const rule = rules[field];
    const raw = body[field];
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false, kind: "type", field, error: `Trường "${rule.label}" phải là chuỗi ký tự.` };
    }
    let value = (raw ?? "").trim();
    if (rule.lowercase) value = value.toLowerCase();
    if (rule.required && !value) {
      return { ok: false, kind: "missing", field, error: `Vui lòng nhập ${rule.label}.` };
    }
    if (value.length > rule.max) {
      return {
        ok: false,
        kind: "tooLong",
        field,
        error: `Trường "${rule.label}" quá dài (tối đa ${rule.max} ký tự).`,
      };
    }
    values[field] = value;
  }
  return { ok: true, values };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email tối đa 254 ký tự, dạng a@b.c — gọi sau khi đã trim + lowercase. */
export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_REGEX.test(email);
}

/**
 * Chuẩn hoá số điện thoại: bỏ khoảng trắng, dấu chấm, gạch ngang, ngoặc mà
 * người dùng hay gõ (VD "090 123-4567"). Không đổi +84 thành 0.
 */
export function normalizeVnPhone(phone: string): string {
  return phone.replace(/[\s.\-()]/g, "");
}

/** Số điện thoại VN 10 chữ số bắt đầu bằng 0, hoặc dạng +84 + 9 chữ số. */
export function isValidVnPhone(phone: string): boolean {
  return /^(?:0|\+84)[1-9]\d{8}$/.test(phone);
}

/** Chuẩn hoá số CCCD: bỏ khoảng trắng (VD "038 201 001 234"). */
export function normalizeCccd(idNumber: string): string {
  return idNumber.replace(/\s/g, "");
}

/** CCCD gắn chip: đúng 12 chữ số. */
export function isValidCccd(idNumber: string): boolean {
  return /^\d{12}$/.test(idNumber);
}

/**
 * Kiểm tra độ dài field text — giữ lại cho tương thích; route công khai giờ
 * dùng `readStringFields` (kiểm tra cả kiểu lẫn độ dài).
 */
export function findOversizedField(fields: Record<string, { value: string; max: number }>): string | null {
  for (const [name, { value, max }] of Object.entries(fields)) {
    if (value.length > max) return name;
  }
  return null;
}
