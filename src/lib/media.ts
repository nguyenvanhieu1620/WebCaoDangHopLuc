import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { db, schema } from "@/lib/db";
import { normalizeExternalUrl, slugify, videoSource } from "@/lib/utils";
import { checkUpload, uploadKindOf } from "@/lib/upload-rules";
import { UPLOAD_DIR } from "@/lib/upload-dir";

/**
 * Lưu file upload thật vào public/uploads/ trên ổ đĩa máy chủ — đủ dùng khi deploy
 * VPS (1 tiến trình, ổ đĩa bền; nhớ sao lưu thư mục này cùng DB). Nếu sau này chuyển
 * sang serverless thì đổi sang S3/R2: chỉ cần sửa hàm này, mọi nơi gọi
 * saveUploadedFile() không cần đổi.
 */

export type SavedMedia = { url: string; type: "image" | "video" | "document"; filename: string };

/** Ghi 1 file upload xuống đĩa + lưu metadata vào bảng media_items. Trả về url dùng ngay được (VD: trong <img src>). */
export async function saveUploadedFile(file: File): Promise<SavedMedia> {
  // Lớp chặn cuối ở máy chủ — form admin đã kiểm tra cùng quy tắc ngay lúc chọn file
  // (upload-rules.ts) nên bình thường admin không đi tới đây với file sai.
  const problem = checkUpload(file, ["image", "video", "document"]);
  if (problem) throw new Error(problem);
  const kind = uploadKindOf(file.type)!;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const base = slugify(file.name.slice(0, file.name.length - ext.length)) || "file";
  const filename = `${Date.now()}-${base}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/${filename}`;
  const type = kind;

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
/**
 * Video của 1 mục (Đời sống trải nghiệm, Banner Trang chủ): file mới tải lên > video chọn từ Thư viện media >
 * link gõ tay (YouTube… — chỉ khi truyền `linkFieldName`). Tất cả để trống → `null` = không có / gỡ video.
 * Video chọn từ thư viện phải là đường dẫn `/uploads/….mp4|webm`; link gõ tay chuẩn hoá như link mạng xã hội.
 */
export async function resolveVideoUrl(
  formData: FormData,
  fileFieldName: string,
  pickedFieldName: string,
  linkFieldName?: string
): Promise<string | null> {
  const file = formData.get(fileFieldName);
  if (file instanceof File && file.size > 0) {
    const problem = checkUpload(file, ["video"]);
    if (problem) throw new Error(problem);
    return (await saveUploadedFile(file)).url;
  }
  const picked = String(formData.get(pickedFieldName) || "").trim();
  if (picked && videoSource(picked)?.kind === "file") return picked;
  const link = linkFieldName ? String(formData.get(linkFieldName) || "").trim() : "";
  if (!link) return null;
  return videoSource(link)?.kind === "file" ? link : normalizeExternalUrl(link);
}

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
