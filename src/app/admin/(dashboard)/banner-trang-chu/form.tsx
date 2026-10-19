import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertHeroBannerAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa banner Trang chủ — dùng chung cho `them-moi/` và `[id]/`. */
export async function HeroBannerFormPage({ id }: { id?: string }) {
  await requirePermission("homepage");
  const [editing, mediaImages, [{ total }]] = await Promise.all([
    id ? db.query.heroBanners.findFirst({ where: eq(schema.heroBanners.id, id) }) : null,
    listMediaImages(),
    db.select({ total: count() }).from(schema.heroBanners),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? "Sửa banner" : "Thêm banner"}
      description="Ảnh hiện rõ nguyên vẹn ở đầu Trang chủ (không phủ màu, không chữ đè), tự chuyển 6,5 giây/ảnh"
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
