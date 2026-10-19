import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { hasPlaceholder } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { upsertAdmissionItemAction, type AdmissionItemType } from "./actions";

export const SECTIONS: { type: AdmissionItemType; title: string; hint: string }[] = [
  { type: "timeline", title: "Mốc thời gian", hint: "Các giai đoạn tuyển sinh — ô \"Thời gian\" hiện nổi bật trên dòng thời gian." },
  { type: "method", title: "Phương thức & điều kiện", hint: "Phương thức xét tuyển, đối tượng, điều kiện…" },
  { type: "document", title: "Hồ sơ cần chuẩn bị", hint: "Mỗi mục là 1 dòng trong danh sách kiểm tra." },
];

/** Nhóm hợp lệ từ `?type=` (sai/thiếu → Mốc thời gian). */
export function sectionType(raw: string | undefined): AdmissionItemType {
  return SECTIONS.some((s) => s.type === raw) ? (raw as AdmissionItemType) : "timeline";
}

const inputClass = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Trang Thêm (không có `id`, nhóm theo `?type=`) / Sửa mục thông tin tuyển sinh. */
export async function AdmissionItemFormPage({ id, type }: { id?: string; type?: string }) {
  await requirePermission("admissions-contact");
  const editing = id ? await db.query.admissionItems.findFirst({ where: eq(schema.admissionItems.id, id) }) : null;
  if (id && !editing) notFound();
  const formType = editing ? sectionType(editing.type) : sectionType(type);
  const [{ total }] = await db.select({ total: count() }).from(schema.admissionItems).where(eq(schema.admissionItems.type, formType));
  const backHref = `/admin/thong-tin-tuyen-sinh?type=${formType}`;
  const needsFill = editing && (hasPlaceholder(editing.title) || hasPlaceholder(editing.detail) || hasPlaceholder(editing.meta));

  return (
    <AdminFormLayout
      title={editing ? "Sửa mục tuyển sinh" : `Thêm mục: ${SECTIONS.find((s) => s.type === formType)!.title}`}
      description="Mốc thời gian, phương thức và hồ sơ hiển thị ở trang /tuyen-sinh"
      backHref={backHref}
    >
      {needsFill && (
        <div role="alert" className="mb-5 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
          ⚠️ Mục này còn ghi chú dạng <code>[Trường điền: …]</code> — web công khai đang hiện &quot;Đang cập nhật&quot; thay cho phần này.
        </div>
      )}
      <form action={upsertAdmissionItemAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="ai-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thuộc nhóm</label>
          <select id="ai-type" name="type" defaultValue={formType} className={inputClass}>
            {SECTIONS.map((s) => (
              <option key={s.type} value={s.type}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ai-title" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tiêu đề</label>
          <input id="ai-title" name="title" required maxLength={200} defaultValue={editing?.title} className={inputClass} placeholder="VD: Nộp hồ sơ xét tuyển" />
        </div>
        <div>
          <label htmlFor="ai-meta" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Thời gian <span className="font-normal text-ink-faint">(chỉ dùng cho Mốc thời gian)</span>
          </label>
          <input id="ai-meta" name="meta" maxLength={120} defaultValue={editing?.meta ?? ""} className={inputClass} placeholder="VD: 01/03 – 30/06/2026" />
        </div>
        <div>
          <label htmlFor="ai-detail" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Mô tả <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
          </label>
          <textarea id="ai-detail" name="detail" rows={4} maxLength={600} defaultValue={editing?.detail ?? ""} className={inputClass} />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "title", enName: "titleEn" },
                { viName: "meta", enName: "metaEn" },
                { viName: "detail", enName: "detailEn" },
              ]}
            />
            <input aria-label="Title (English)" name="titleEn" defaultValue={editing?.titleEn ?? ""} placeholder="Title (English)" className={inputClass} />
            <input aria-label="Time (English)" name="metaEn" defaultValue={editing?.metaEn ?? ""} placeholder="Time (English)" className={inputClass} />
            <textarea aria-label="Description (English)" name="detailEn" rows={3} defaultValue={editing?.detailEn ?? ""} placeholder="Description (English)" className={inputClass} />
          </div>
        </details>
        <div>
          <label htmlFor="ai-sort" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input id="ai-sort" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? total} className={`${inputClass} max-w-[200px]`} />
        </div>
        <FormActions cancelHref={backHref} submitLabel={editing ? "Lưu thay đổi" : "Thêm mục"} />
      </form>
    </AdminFormLayout>
  );
}
