import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Ảnh trong Thư viện media (mới nhất trước) — danh sách chọn của `<ImagePicker>` ở các form admin. */
export function listMediaImages() {
  return db.query.mediaItems.findMany({
    where: eq(schema.mediaItems.type, "image"),
    orderBy: [desc(schema.mediaItems.createdAt), desc(schema.mediaItems.seq)],
  });
}
