import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertTestimonialAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa đánh giá cựu sinh viên — dùng chung cho `them-moi/` và `[id]/`. */
export async function TestimonialFormPage({ id }: { id?: string }) {
  await requirePermission("homepage");
  const [editing, mediaImages, [{ total }]] = await Promise.all([
    id ? db.query.testimonials.findFirst({ where: eq(schema.testimonials.id, id) }) : null,
    listMediaImages(),
    db.select({ total: count() }).from(schema.testimonials),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm đánh giá"}
      description="Trích dẫn cảm nhận hiển thị ở khối 'Câu chuyện thành công' Trang chủ"
      backHref="/admin/danh-gia"
    >
      <form action={upsertTestimonialAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-danh-gia-quote" className="mb-1.5 block text-xs font-semibold text-ink-soft">Trích dẫn</label>
          <textarea
            id="f-danh-gia-quote"
            name="quote"
            required
            rows={4}
            defaultValue={editing?.quote}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="Cảm nhận của cựu sinh viên..."
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-danh-gia-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Họ tên</label>
            <input
              id="f-danh-gia-name"
              name="name"
              required
              defaultValue={editing?.name}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="f-danh-gia-role" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vai trò hiện tại</label>
            <input
              id="f-danh-gia-role"
              name="role"
              required
              defaultValue={editing?.role}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="VD: Điều dưỡng viên, BV Đa khoa tỉnh"
            />
          </div>
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "quote", enName: "quoteEn" },
                { viName: "role", enName: "roleEn" },
              ]}
            />
            <textarea
              aria-label="Quote (English)"
              name="quoteEn"
              rows={4}
              defaultValue={editing?.quoteEn ?? ""}
              placeholder="Quote (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <input
              aria-label="Role (English)"
              name="roleEn"
              defaultValue={editing?.roleEn ?? ""}
              placeholder="Role (English)"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div>
          <label htmlFor="f-danh-gia-avatar" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh đại diện {editing ? "(để trống = giữ ảnh cũ)" : ""}
          </label>
          <ImagePicker
            id="f-danh-gia-avatar"
            spec="avatar"
            fileFieldName="avatar"
            pickedFieldName="avatarExisting"
            images={mediaImages}
            currentUrl={editing?.avatarUrl}
          />
        </div>
        <div>
          <label htmlFor="f-danh-gia-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input
            id="f-danh-gia-sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/danh-gia" submitLabel={editing ? "Lưu thay đổi" : "Thêm đánh giá"} />
      </form>
    </AdminFormLayout>
  );
}
