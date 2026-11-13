"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { isLibraryImageUrl, resolveImageUrl, resolveVideoUrl, saveWithMedia } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import type { AdminSaveResult } from "@/lib/admin-form";
import { safeHref } from "@/lib/safe-href";
import { checkUpload } from "@/lib/upload-rules";
import { normalizeExternalUrl, videoSource } from "@/lib/utils";

export async function upsertGalleryItemAction(formData: FormData): Promise<AdminSaveResult> {
  await requirePermission("homepage");
  const id = String(formData.get("id") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const captionEn = String(formData.get("captionEn") || "").trim();

  const image = formData.get("image");
  const pickedImage = String(formData.get("imageExisting") || "").trim();
  const videoFile = formData.get("videoFile");
  const pickedVideo = String(formData.get("videoExisting") || "").trim();
  const videoLink = String(formData.get("videoUrl") || "").trim();
  const hasImageFile = image instanceof File && image.size > 0;
  const hasVideoFile = videoFile instanceof File && videoFile.size > 0;
  const normalizedVideoLink = videoSource(videoLink)?.kind === "file"
    ? videoLink
    : safeHref(normalizeExternalUrl(videoLink) ?? "");
  const message = "Chưa lưu mục trải nghiệm. Kiểm tra lại thông tin bên dưới.";
  const fields: NonNullable<AdminSaveResult["fields"]> = {};
  if (!caption) fields.caption = "Nhập chú thích.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập vị trí là số nguyên trong phạm vi hợp lệ.";
  }
  if (hasImageFile) {
    const problem = checkUpload(image, ["image"]);
    if (problem) fields.image = problem;
  } else if (pickedImage && !isLibraryImageUrl(pickedImage)) {
    fields.image = "Chọn lại ảnh bìa từ thư viện.";
  } else if (!id && !pickedImage) {
    fields.image = "Chọn ảnh bìa hoặc tải ảnh lên.";
  }
  if (hasVideoFile) {
    const problem = checkUpload(videoFile, ["video"]);
    if (problem) fields.videoFile = problem;
  } else if (pickedVideo && videoSource(pickedVideo)?.kind !== "file") {
    fields.videoExisting = "Chọn lại video từ thư viện.";
  }
  const usesVideoLink = !hasVideoFile && !pickedVideo && !!videoLink;
  const invalidVideoLink = usesVideoLink && !videoSource(normalizedVideoLink);
  const videoLinkError = "Nhập đường dẫn đến một video YouTube hoặc chọn video từ thư viện.";
  if (invalidVideoLink && (!id || !normalizedVideoLink)) fields.videoUrl = videoLinkError;
  if (Object.keys(fields).length > 0) return { message, fields };

  const [captionEnFinal] = await autoFillTranslations([{ vi: caption, en: captionEn }]);

  const progress: { field?: "image" | "videoFile" } = {};
  const saved = await saveWithMedia(async (tx, uploadOptions) => {
    const [current] = id
      ? await tx.select({ imageUrl: schema.galleryItems.imageUrl, videoUrl: schema.galleryItems.videoUrl })
        .from(schema.galleryItems).where(eq(schema.galleryItems.id, id)).for("update")
      : [];
    if (id && !current) return { message: "Mục này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };
    // Link ngoài đã lưu trước đây vẫn được giữ khi chỉ sửa chú thích hoặc ảnh bìa.
    if (invalidVideoLink && videoLink !== current?.videoUrl) return { message, fields: { videoUrl: videoLinkError } };

    progress.field = "image";
    const imageUrl = await resolveImageUrl(formData, "image", "imageExisting", current?.imageUrl ?? null, uploadOptions);
    if (!imageUrl) return { message, fields: { image: "Chọn ảnh bìa hoặc tải ảnh lên." } };
    progress.field = "videoFile";
    const videoUrl = usesVideoLink
      ? (invalidVideoLink ? videoLink : normalizedVideoLink)
      : await resolveVideoUrl(formData, "videoFile", "videoExisting", undefined, uploadOptions);
    progress.field = undefined;

    const values = { caption, captionEn: captionEnFinal || null, sortOrder, imageUrl, videoUrl };
    if (id) {
      await tx.update(schema.galleryItems).set(values).where(eq(schema.galleryItems.id, id));
    } else {
      await tx.insert(schema.galleryItems).values(values);
    }
    return null;
  });
  if ("error" in saved) {
    console.error("Không lưu được mục trải nghiệm.", saved.error);
    if (saved.unconfirmed) {
      return { message: "Chưa xác nhận được kết quả lưu. Kiểm tra danh sách trước khi thử lại." };
    }
    if (progress.field) {
      const kind = progress.field === "image" ? "ảnh bìa" : "video";
      return { message, fields: { [progress.field]: `Kiểm tra lại định dạng và dung lượng ${kind}.` } };
    }
    return { message: "Chưa lưu được mục trải nghiệm. Vui lòng thử lại sau ít phút." };
  }
  if (saved.result) return saved.result;

  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");
  revalidatePath("/thu-vien");

  redirect("/admin/thu-vien-trang-chu?saved=1");
}

export async function deleteGalleryItemAction(itemId: string) {
  await requirePermission("homepage");
  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.id, itemId));
  revalidatePath("/admin/thu-vien-trang-chu");
  revalidatePath("/");
  revalidatePath("/thu-vien");
}
