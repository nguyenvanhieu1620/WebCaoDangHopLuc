"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { saveUploadedFile } from "@/lib/media";

export async function uploadMediaAction(formData: FormData) {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    await saveUploadedFile(file);
  }
  revalidatePath("/admin/media");
}

export async function deleteMediaAction(mediaId: string) {
  const item = await db.query.mediaItems.findFirst({ where: eq(schema.mediaItems.id, mediaId) });
  if (item) {
    await unlink(path.join(process.cwd(), "public", item.url)).catch(() => {});
    await db.delete(schema.mediaItems).where(eq(schema.mediaItems.id, mediaId));
  }
  revalidatePath("/admin/media");
}
