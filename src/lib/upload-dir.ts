import path from "node:path";

/**
 * Thư mục lưu file admin tải lên (ảnh, video, tài liệu) — URL công khai là `/uploads/<tên file>`.
 * Dùng chung cho `saveUploadedFile` (ghi) và route `src/app/uploads/[...path]/route.ts` (đọc).
 *
 * turbopackIgnore: thư mục dữ liệu lúc chạy, không phải mã nguồn — không để Turbopack lần theo lúc build
 * (trên VPS public/uploads là symlink ra ngoài dự án, Turbopack lần theo sẽ báo lỗi và build hỏng).
 */
export const UPLOAD_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
