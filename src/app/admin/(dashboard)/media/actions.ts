"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unlink } from "node:fs/promises";
import { uploadedFilePath } from "@/lib/upload-dir";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFile } from "@/lib/media";
import { purgeOptimizedImageCache } from "@/lib/image-cache";
import { requirePermission } from "@/lib/admin-auth";

export async function uploadMediaAction(formData: FormData) {
  await requirePermission("media");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    await saveUploadedFile(file);
  }
  revalidatePath("/admin/media");
  redirect(`/admin/media?uploaded=${files.length}`);
}

export async function deleteMediaAction(mediaId: string) {
  await requirePermission("media");
  const item = await db.query.mediaItems.findFirst({ where: eq(schema.mediaItems.id, mediaId) });
  if (item) {
    const filePath = uploadedFilePath(item.url);
    if (!filePath) throw new Error("Đường dẫn tệp không nằm trong thư mục uploads.");
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    await purgeOptimizedImageCache();
    await db.delete(schema.mediaItems).where(eq(schema.mediaItems.id, mediaId));
  }
  revalidatePath("/admin/media");
}
