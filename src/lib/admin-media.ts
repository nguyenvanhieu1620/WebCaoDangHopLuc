import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Video MP4/WEBM trong Thư viện media (mới nhất trước) — ô "chọn video có sẵn" ở form Đời sống trải nghiệm, Banner Trang chủ. */
export function listMediaVideos() {
  return db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "video"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });
}

/** Ảnh trong Thư viện media (mới nhất trước) — danh sách chọn của `<ImagePicker>` ở các form admin. */
export function listMediaImages() {
  return db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });
}
