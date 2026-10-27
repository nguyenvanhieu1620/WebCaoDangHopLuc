import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { CheckedFileInput } from "@/components/admin/CheckedFileInput";
import { db, schema } from "@/lib/db";
import { listMediaImages, listMediaVideos } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertHeroBannerAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa banner Trang chủ — dùng chung cho `them-moi/` và `[id]/`. */
export async function HeroBannerFormPage({ id }: { id?: string }) {
  await requirePermission("homepage");
  const [editing, mediaImages, mediaVideos, [{ total }]] = await Promise.all([
    id ? db.query.heroBanners.findFirst({ where: eq(schema.heroBanners.id, id) }) : null,
    listMediaImages(),
    listMediaVideos(),
    db.select({ total: count() }).from(schema.heroBanners),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? "Sửa banner" : "Thêm banner"}
      description="Ảnh phủ kín khung banner, có thể cắt theo màn hình; tự chuyển 6,5 giây/ảnh. Xem khuyến nghị kích thước dưới ô chọn ảnh."
      backHref="/admin/banner-trang-chu"
    >
      <form action={upsertHeroBannerAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-banner-trang-chu-image" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh {editing ? "(để trống = giữ ảnh cũ)" : ""}
          </label>
          <ImagePicker
            id="f-banner-trang-chu-image"
            spec="hero"
            fileFieldName="image"
            pickedFieldName="imageExisting"
            images={mediaImages}
            currentUrl={editing?.imageUrl}
          />
        </div>
        <fieldset className="rounded-xl border border-line p-4">
          <legend className="px-1 text-xs font-semibold text-ink-soft">Video nền (tuỳ chọn)</legend>
          <p className="mb-3 text-[11.5px] leading-relaxed text-ink-faint">
            Chỉ phát trên máy tính, trong khung ảnh banner: tự chạy, tắt tiếng, lặp lại, có nút tạm dừng. Điện thoại và người
            bật &quot;giảm chuyển động&quot; vẫn thấy ẢNH ở trên (ảnh cũng là ảnh chờ khi video đang tải). Khuyến nghị MP4 (H.264),
            5–15 giây, 1920×1080 hoặc 1280×720, dưới 10MB — video nặng làm Trang chủ tải chậm. Để trống cả 2 ô = không có video.
          </p>
          <label htmlFor="f-banner-trang-chu-videoExisting" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Chọn video có sẵn trong Thư viện media
          </label>
          <select
            id="f-banner-trang-chu-videoExisting"
            name="videoExisting"
            defaultValue={editing?.videoUrl ?? ""}
            className="mb-3 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">— Không dùng video —</option>
            {editing?.videoUrl && !mediaVideos.some((v) => v.url === editing.videoUrl) && <option value={editing.videoUrl}>Video đang dùng</option>}
            {mediaVideos.map((v) => (
              <option key={v.id} value={v.url}>
                {v.filename}
              </option>
            ))}
          </select>
          <label htmlFor="f-banner-trang-chu-video" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            …hoặc tải video mới lên
          </label>
          <CheckedFileInput
            id="f-banner-trang-chu-video"
            kinds={["video"]}
            name="video"
            accept="video/mp4,video/webm"
            className="w-full max-w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-paper-alt file:px-3 file:py-2 file:text-[12.5px] file:font-semibold file:text-brand-700"
          />
        </fieldset>
        <div>
          <label htmlFor="f-banner-trang-chu-caption" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chú thích (tuỳ chọn)</label>
          <input
            id="f-banner-trang-chu-caption"
            name="caption"
            defaultValue={editing?.caption ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Sinh viên thực hành lâm sàng"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Chú thích tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "caption", enName: "captionEn" }]} />
            <input
              aria-label="Caption (English)"
              name="captionEn"
              defaultValue={editing?.captionEn ?? ""}
              placeholder="Caption (English)"
              className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div>
          <label htmlFor="f-banner-trang-chu-linkUrl" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Bấm vào banner đi tới đâu (tuỳ chọn)
          </label>
          <input
            id="f-banner-trang-chu-linkUrl"
            name="linkUrl"
            defaultValue={editing?.linkUrl ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: /tuyen-sinh"
          />
        </div>
        <div>
          <label htmlFor="f-banner-trang-chu-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input
            id="f-banner-trang-chu-sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/banner-trang-chu" submitLabel={editing ? "Lưu thay đổi" : "Thêm banner"} />
      </form>
    </AdminFormLayout>
  );
}
