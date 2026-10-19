import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { isoToVnDatetimeLocal } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { upsertEventAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa sự kiện — dùng chung cho `them-moi/` và `[id]/`. */
export async function EventFormPage({ id }: { id?: string }) {
  await requirePermission("events");
  const [editing, mediaImages] = await Promise.all([
    id ? db.query.events.findFirst({ where: eq(schema.events.id, id) }) : null,
    listMediaImages(),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.title}` : "Thêm sự kiện"}
      description="Lịch sự kiện hiển thị ở /su-kien — khác Tin tức"
      backHref="/admin/su-kien"
      wide
    >
      {editing?.slug && (
        <p className="mb-5 text-[12.5px] text-ink-faint">
          Trang trên web:{" "}
          <a href={`/su-kien/${editing.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-brand-700 hover:underline">
            /su-kien/{editing.slug} ↗
          </a>
        </p>
      )}
      <form action={upsertEventAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-su-kien-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên sự kiện</label>
          <input
            id="f-su-kien-title"
            name="title"
            required
            defaultValue={editing?.title}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Ngày hội tư vấn tuyển sinh 2026"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="f-su-kien-startAt" className="mb-1.5 block text-xs font-semibold text-ink-soft">Bắt đầu</label>
            <input
              id="f-su-kien-startAt"
              name="startAt"
              type="datetime-local"
              required
              defaultValue={isoToVnDatetimeLocal(editing?.startAt)}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="f-su-kien-endAt" className="mb-1.5 block text-xs font-semibold text-ink-soft">Kết thúc (tuỳ chọn)</label>
            <input
              id="f-su-kien-endAt"
              name="endAt"
              type="datetime-local"
              defaultValue={isoToVnDatetimeLocal(editing?.endAt)}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="f-su-kien-location" className="mb-1.5 block text-xs font-semibold text-ink-soft">Địa điểm (tuỳ chọn)</label>
            <input
              id="f-su-kien-location"
              name="location"
              defaultValue={editing?.location ?? ""}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="VD: Hội trường A"
            />
          </div>
        </div>
        <div>
          <label htmlFor="f-su-kien-description" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả (tuỳ chọn)</label>
          <MarkdownEditor
            id="f-su-kien-description"
            name="description"
            rows={12}
            defaultValue={editing?.description ?? ""}
            placeholder="Nội dung chi tiết sự kiện..."
          />
        </div>
        <div>
          <label htmlFor="f-su-kien-coverImage" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh sự kiện (tuỳ chọn) {editing ? "— để trống = giữ ảnh cũ" : ""}
          </label>
          <ImagePicker
            id="f-su-kien-coverImage"
            spec="cover"
            fileFieldName="coverImage"
            pickedFieldName="coverImageExisting"
            images={mediaImages}
            currentUrl={editing?.coverImageUrl}
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "title", enName: "titleEn" },
                { viName: "location", enName: "locationEn" },
                { viName: "description", enName: "descriptionEn" },
              ]}
            />
            <input
              aria-label="Title (English)"
              name="titleEn"
              defaultValue={editing?.titleEn ?? ""}
              placeholder="Title (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <input
              aria-label="Location (English)"
              name="locationEn"
              defaultValue={editing?.locationEn ?? ""}
              placeholder="Location (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <MarkdownEditor aria-label="Description (English)" name="descriptionEn" rows={8} defaultValue={editing?.descriptionEn ?? ""} placeholder="Description (English)" />
          </div>
        </details>
        <FormActions cancelHref="/admin/su-kien" submitLabel={editing ? "Lưu thay đổi" : "Thêm sự kiện"} />
      </form>
    </AdminFormLayout>
  );
}
