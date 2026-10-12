/**
 * Giới hạn file tải lên — DÙNG CHUNG cho trình duyệt (kiểm tra ngay lúc chọn file, báo lỗi
 * trên form) và máy chủ (`saveUploadedFile` trong media.ts, lớp chặn cuối). Không import gì
 * của Node để Client Component dùng được. Đổi giới hạn ở đây là cả 2 phía đổi theo; nhớ
 * giữ `experimental.serverActions.bodySizeLimit` trong next.config.js lớn hơn mức lớn nhất.
 */

export type UploadKind = "image" | "video" | "document";

export const MAX_UPLOAD_BYTES: Record<UploadKind, number> = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

export const ALLOWED_UPLOAD_TYPES: Record<UploadKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm"],
  /** Tệp đính kèm cho bài viết/thông báo — VD quyết định tuyển sinh, biểu mẫu, đề cương. */
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

const KIND_LABEL: Record<UploadKind, string> = {
  image: "ảnh JPG/PNG/WEBP/GIF",
  video: "video MP4/WEBM",
  document: "tài liệu PDF/Word/Excel",
};

export function uploadKindOf(mimeType: string): UploadKind | null {
  for (const kind of Object.keys(ALLOWED_UPLOAD_TYPES) as UploadKind[]) {
    if (ALLOWED_UPLOAD_TYPES[kind].includes(mimeType)) return kind;
  }
  return null;
}

/** "14,2MB" / "850KB" — hiển thị dung lượng cho admin. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/**
 * Kiểm tra 1 file trước khi tải lên. Trả về câu báo lỗi tiếng Việt (nêu rõ tên file + cách
 * sửa) hoặc `null` nếu hợp lệ. `accept` = loại file ô đó nhận.
 */
export function checkUpload(file: { name: string; type: string; size: number }, accept: UploadKind[]): string | null {
  const name = `"${file.name}"`;
  if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) {
    return `${name} là ảnh HEIC (thường chụp từ iPhone) — web chưa hiển thị được định dạng này. Chuyển sang JPG rồi tải lại (iPhone: Cài đặt › Camera › Định dạng › "Tương thích nhất").`;
  }
  const kind = uploadKindOf(file.type);
  if (!kind || !accept.includes(kind)) {
    return `${name} không đúng định dạng — ô này chỉ nhận ${accept.map((k) => KIND_LABEL[k]).join(", ")}.`;
  }
  const max = MAX_UPLOAD_BYTES[kind];
  if (file.size > max) {
    const how = kind === "image" ? "nén ảnh hoặc giảm kích thước (VD bằng squoosh.app)" : kind === "video" ? "nén video hoặc cắt ngắn bớt" : "nén hoặc tách nhỏ tệp";
    return `${name} nặng ${formatBytes(file.size)} — tối đa ${formatBytes(max)}. Hãy ${how} rồi tải lại.`;
  }
  return null;
}
