import { notFound } from "next/navigation";
import { eq, max } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { hasPlaceholder } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { upsertMilestoneAction } from "./actions";

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Năm hiện tại — hàm thường ngoài component (rule react-hooks/purity cấm `new Date()` trong thân component). */
function currentYear(): number {
  return new Date().getFullYear();
}

/** Trang Thêm (không có `id`) / Sửa cột mốc — dùng chung cho `them-moi/` và `[id]/`. */
export async function MilestoneFormPage({ id }: { id?: string }) {
  await requirePermission("pages");
  const [editing, mediaImages, [{ latestYear }]] = await Promise.all([
    id ? db.query.milestones.findFirst({ where: eq(schema.milestones.id, id) }) : null,
    listMediaImages(),
    db.select({ latestYear: max(schema.milestones.year) }).from(schema.milestones),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? "Sửa cột mốc" : "Thêm cột mốc"}
      description="Dòng thời gian ở trang Giới thiệu — web hiện theo năm, trong năm theo vị trí (số nhỏ hiện trước)"
      backHref="/admin/cot-moc"
    >
      {editing && (hasPlaceholder(editing.title) || hasPlaceholder(editing.description)) && (
        <div role="alert" className="mb-5 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
          ⚠️ Mốc này còn ghi chú <code>[…]</code> chưa điền — web sẽ ẩn mốc cho tới khi sửa xong.
        </div>
      )}
      <form action={upsertMilestoneAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
          <div>
            <label htmlFor="ms-year" className="mb-1.5 block text-xs font-semibold text-ink-soft">Năm</label>
            <input id="ms-year" name="year" type="number" required min={1900} max={2100} defaultValue={editing?.year ?? latestYear ?? currentYear()} className={input} />
          </div>
          <div>
            <label htmlFor="ms-period" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Thời điểm <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
            </label>
            <input id="ms-period" name="period" maxLength={60} defaultValue={editing?.period ?? ""} placeholder="VD: Tháng 9" className={input} />
          </div>
        </div>
        <div>
          <label htmlFor="ms-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề mốc</label>
          <input id="ms-title" name="title" required maxLength={200} defaultValue={editing?.title} placeholder="VD: Khai giảng khoá đầu tiên ngành Điều dưỡng" className={input} />
        </div>
        <div>
          <label htmlFor="ms-desc" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Mô tả <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
          </label>
          <textarea id="ms-desc" name="description" rows={5} maxLength={2000} defaultValue={editing?.description ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="f-cot-moc-image" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
          </label>
          <ImagePicker id="f-cot-moc-image" spec="milestone" fileFieldName="image" pickedFieldName="imageExisting" images={mediaImages} currentUrl={editing?.imageUrl} />
          {editing?.imageUrl && (
            <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
              <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-line" /> Gỡ ảnh hiện tại
            </label>
          )}
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "period", enName: "periodEn" },
                { viName: "title", enName: "titleEn" },
                { viName: "description", enName: "descriptionEn" },
              ]}
            />
            <input aria-label="Period (English)" name="periodEn" defaultValue={editing?.periodEn ?? ""} placeholder="Period (English)" className={input} />
            <input aria-label="Title (English)" name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={input} />
            <textarea aria-label="Description (English)" name="descriptionEn" rows={3} defaultValue={editing?.descriptionEn ?? ""} placeholder="Description (English)" className={input} />
          </div>
        </details>
        <div>
          <label htmlFor="ms-sort" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí trong năm (số nhỏ hiện trước)</label>
          <input id="ms-sort" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 0} className={`${input} max-w-[200px]`} />
        </div>
        <FormActions cancelHref="/admin/cot-moc" submitLabel={editing ? "Lưu thay đổi" : "Thêm cột mốc"} />
      </form>
    </AdminFormLayout>
  );
}
