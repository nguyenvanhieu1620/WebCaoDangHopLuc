import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { db, schema } from "@/lib/db";
import { slugify } from "@/lib/utils";

/**
 * Lưu file upload thật vào public/uploads/ (đơn giản nhất cho SQLite/dev — xem
 * CLAUDE.md mục 7). Khi lên production đổi sang S3: chỉ cần sửa hàm này, mọi nơi
 * gọi saveUploadedFile() không cần đổi.
 */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
/** Tệp đính kèm cho bài viết/thông báo — VD quyết định tuyển sinh, biểu mẫu, đề cương. */
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export type SavedMedia = { url: string; type: "image" | "video" | "document"; filename: string };

/** Ghi 1 file upload xuống đĩa + lưu metadata vào bảng media_items. Trả về url dùng ngay được (VD: trong <img src>). */
export async function saveUploadedFile(file: File): Promise<SavedMedia> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);
  if (!isImage && !isVideo && !isDocument) {
    throw new Error(
      "Định dạng file không được hỗ trợ (chỉ JPG/PNG/WEBP/GIF, MP4/WEBM, hoặc PDF/Word/Excel)."
    );
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : isVideo ? MAX_VIDEO_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > maxBytes) {
    throw new Error(`File vượt quá dung lượng cho phép (tối đa ${Math.round(maxBytes / 1024 / 1024)}MB).`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const base = slugify(file.name.slice(0, file.name.length - ext.length)) || "file";
  const filename = `${Date.now()}-${base}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/${filename}`;
  const type: "image" | "video" | "document" = isImage ? "image" : isVideo ? "video" : "document";

  await db.insert(schema.mediaItems).values({ filename, url, type });

  return { url, type, filename };
}

/** Upload nếu form có chọn file, trả về url — nếu không chọn file thì trả về giá trị fallback (VD: ảnh cũ khi sửa). */
export async function saveUploadedFileIfPresent(
  formData: FormData,
  fieldName: string,
  fallbackUrl: string | null = null
): Promise<string | null> {
  const file = formData.get(fieldName);
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file);
    return saved.url;
  }
  return fallbackUrl;
}

/**
 * Giống `saveUploadedFileIfPresent` nhưng còn hỗ trợ chọn ảnh có sẵn từ Thư
 * viện media (dùng cùng <ImagePicker>, xem src/components/admin/ImagePicker.tsx).
 * Thứ tự ưu tiên: file mới tải lên > ảnh chọn từ thư viện > giá trị cũ (khi sửa).
 */
export async function resolveImageUrl(
  formData: FormData,
  fileFieldName: string,
  pickedFieldName: string,
  fallbackUrl: string | null = null
): Promise<string | null> {
  const file = formData.get(fileFieldName);
  if (file instanceof File && file.size > 0) {
    const saved = await saveUploadedFile(file);
    return saved.url;
  }
  const picked = String(formData.get(pickedFieldName) || "").trim();
  if (picked) return picked;
  return fallbackUrl;
}
