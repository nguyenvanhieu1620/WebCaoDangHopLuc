/**
 * Kiểm tra NỘI DUNG file tải lên khớp với loại khai báo — chặn file giả dạng (VD trang HTML đặt
 * tên/loại là ảnh). Loại MIME do trình duyệt người gửi tự báo nên không đáng tin; ở đây đọc vài
 * byte đầu ("chữ ký" của từng định dạng). Đuôi file lưu trên đĩa cũng lấy theo loại đã kiểm tra
 * (`EXTENSION_BY_MIME`), KHÔNG lấy từ tên file gốc: `x.html` khai là ảnh PNG phải thành `x.png`,
 * nếu không `next start` sẽ phục vụ nó như trang HTML ngay trên tên miền của trường.
 */

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  return sig.every((b, i) => bytes[offset + i] === b);
}

const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // .doc / .xls (Office 97–2003)
const ZIP = [0x50, 0x4b, 0x03, 0x04]; // .docx / .xlsx (Office Open XML là file zip)

const CHECKS: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  "image/png": (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/gif": (b) => startsWith(b, ascii("GIF87a")) || startsWith(b, ascii("GIF89a")),
  "image/webp": (b) => startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
  "video/mp4": (b) => startsWith(b, ascii("ftyp"), 4),
  "video/webm": (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]),
  // Chuẩn PDF cho phép vài byte rác trước "%PDF-" (trong 1KB đầu).
  "application/pdf": (b) => Buffer.from(b.subarray(0, 1024)).includes("%PDF-"),
  "application/msword": (b) => startsWith(b, OLE),
  "application/vnd.ms-excel": (b) => startsWith(b, OLE),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (b) => startsWith(b, ZIP),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (b) => startsWith(b, ZIP),
};

/** true nếu vài byte đầu của file đúng định dạng `mimeType` (loại không có trong danh sách → false). */
export function contentMatchesType(mimeType: string, bytes: Uint8Array): boolean {
  return CHECKS[mimeType]?.(bytes) ?? false;
}
