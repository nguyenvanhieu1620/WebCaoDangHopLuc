import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertGalleryItemAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa ảnh thư viện Trang chủ — dùng chung cho `them-moi/` và `[id]/`. */
export async function GalleryItemFormPage({ id }: { id?: string }) {
  await requirePermission("homepage");
  const [editing, mediaImages, [{ total }]] = await Promise.all([
    id ? db.query.galleryItems.findFirst({ where: eq(schema.galleryItems.id, id) }) : null,
    listMediaImages(),
    db.select({ total: count() }).from(schema.galleryItems),
  ]);
  if (id && !editing) notFound();

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
        <div>
          <label htmlFor="f-thu-vien-trang-chu-videoUrl" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Link video (YouTube, tuỳ chọn)
          </label>
          <input
            id="f-thu-vien-trang-chu-videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={editing?.videoUrl ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1 text-[11px] text-ink-faint">
            Có link thì ảnh trên đóng vai trò ảnh bìa — khách bấm vào sẽ xem video.
          </p>
        </div>
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
