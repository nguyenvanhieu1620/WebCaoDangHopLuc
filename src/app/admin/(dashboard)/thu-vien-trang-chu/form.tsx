import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { CheckedFileInput } from "@/components/admin/CheckedFileInput";
import { db, schema } from "@/lib/db";
import { listMediaImages, listMediaVideos } from "@/lib/admin-media";
import { videoSource } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { upsertGalleryItemAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa mục Đời sống trải nghiệm — dùng chung cho `them-moi/` và `[id]/`. */
export async function GalleryItemFormPage({ id }: { id?: string }) {
  await requirePermission("homepage");
  const [editing, mediaImages, mediaVideos, [{ total }]] = await Promise.all([
    id ? db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, id) }) : null,
    listMediaImages(),
    listMediaVideos(),
    db.select({ total: count() }).from(schema.galleryItems),
  ]);
  if (id && !editing) notFound();
  // Video hiện tại là file đã tải lên (/uploads/…) → chọn sẵn ở ô thư viện; còn lại (YouTube…) → ô link.
  const currentIsUpload = videoSource(editing?.videoUrl)?.kind === "file";

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.caption}` : "Thêm ảnh/video"}
      description="Đời sống trải nghiệm — khối 'Đời sống sinh viên – Trải nghiệm Hợp Lực' ở Trang chủ (5 mục đầu) và trang /thu-vien"
      backHref="/admin/thu-vien-trang-chu"
    >
      <form action={upsertGalleryItemAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-thu-vien-trang-chu-caption" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chú thích</label>
          <input
            id="f-thu-vien-trang-chu-caption"
            name="caption"
            required
            defaultValue={editing?.caption}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Thực hành lâm sàng"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Chú thích tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "caption", enName: "captionEn" }]} />
          </div>
          <input
            aria-label="Caption (English)"
            name="captionEn"
            defaultValue={editing?.captionEn ?? ""}
            placeholder="Caption (English)"
            className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </details>
        <div>
          <label htmlFor="f-thu-vien-trang-chu-image" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh {editing ? "(để trống = giữ ảnh cũ)" : ""}
          </label>
          <ImagePicker
            id="f-thu-vien-trang-chu-image"
            spec="gallery"
            fileFieldName="image"
            pickedFieldName="imageExisting"
            images={mediaImages}
            currentUrl={editing?.imageUrl}
          />
        </div>
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-xs font-semibold text-ink-soft">Video (tuỳ chọn)</legend>
          <p className="mb-3 text-[11.5px] leading-relaxed text-ink-faint">
            Có video thì ảnh ở trên là ảnh bìa — khách bấm vào xem video ngay trên trang. Chọn 1 trong 3 cách; để trống cả 3
            = không có video (gỡ video cũ). Video dài nên đưa lên YouTube; video tải lên nên ngắn, dưới 50MB.
          </p>
          <div className="space-y-3">
            <div>
              <label htmlFor="f-thu-vien-trang-chu-videoUrl" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Link YouTube
              </label>
              <input
                id="f-thu-vien-trang-chu-videoUrl"
                name="videoUrl"
                defaultValue={editing?.videoUrl && !currentIsUpload ? editing.videoUrl : ""}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label htmlFor="f-thu-vien-trang-chu-videoExisting" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                …hoặc chọn video đã tải lên Thư viện media
              </label>
              <select
                id="f-thu-vien-trang-chu-videoExisting"
                name="videoExisting"
                defaultValue={currentIsUpload ? editing!.videoUrl! : ""}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">— Không chọn —</option>
                {currentIsUpload && !mediaVideos.some((v) => v.url === editing!.videoUrl) && (
                  <option value={editing!.videoUrl!}>Video đang dùng</option>
                )}
                {mediaVideos.map((v) => (
                  <option key={v.id} value={v.url}>
                    {v.filename}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-thu-vien-trang-chu-videoFile" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                …hoặc tải video mới lên (MP4/WEBM)
              </label>
              <CheckedFileInput
                id="f-thu-vien-trang-chu-videoFile"
                kinds={["video"]}
                name="videoFile"
                accept="video/mp4,video/webm"
                className="w-full max-w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
              />
            </div>
          </div>
        </fieldset>
        <div>
          <label htmlFor="f-thu-vien-trang-chu-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input
            id="f-thu-vien-trang-chu-sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/thu-vien-trang-chu" submitLabel={editing ? "Lưu thay đổi" : "Thêm ảnh"} />
      </form>
    </AdminFormLayout>
  );
}
