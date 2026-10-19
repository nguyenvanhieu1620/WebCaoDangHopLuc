import path from "node:path";

/**
 * Thư mục lưu file admin tải lên (ảnh, video, tài liệu) — URL công khai là `/uploads/<tên file>`.
 * Dùng chung cho `saveUploadedFile` (ghi) và route `src/app/uploads/[...path]/route.ts` (đọc).
 */
export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
