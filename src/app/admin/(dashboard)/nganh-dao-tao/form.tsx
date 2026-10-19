import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { db, schema } from "@/lib/db";
import { listMediaImages } from "@/lib/admin-media";
import { requirePermission } from "@/lib/admin-auth";
import { upsertProgramAction } from "./actions";

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Trang Thêm (không có `id`) / Sửa ngành đào tạo — dùng chung cho `them-moi/` và `[id]/`. */
export async function ProgramFormPage({ id }: { id?: string }) {
  await requirePermission("programs");
  const [editing, mediaImages] = await Promise.all([
    id ? db.query.programs.findFirst({ where: eq(schema.programs.id, id) }) : null,
    listMediaImages(),
  ]);
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm ngành đào tạo"}
      description="Hiển thị ở Trang chủ & /nganh-dao-tao"
      backHref="/admin/nganh-dao-tao"
      wide
    >
      {editing && (
        <p className="mb-5 text-[12.5px] text-ink-faint">
          Trang trên web:{" "}
          <a href={`/nganh-dao-tao/${editing.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-brand-700 hover:underline">
            /nganh-dao-tao/{editing.slug} ↗
          </a>
        </p>
      )}
      <form action={upsertProgramAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <label htmlFor="f-nganh-dao-tao-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên ngành</label>
            <input id="f-nganh-dao-tao-name" name="name" required defaultValue={editing?.name} className={input} placeholder="VD: Điều dưỡng" />
          </div>
          <div>
            <label htmlFor="f-nganh-dao-tao-code" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mã ngành</label>
            <input id="f-nganh-dao-tao-code" name="code" required defaultValue={editing?.code} className={input} placeholder="VD: ĐD" />
          </div>
          <div>
            <label htmlFor="f-nganh-dao-tao-duration" className="mb-1.5 block text-xs font-semibold text-ink-soft">Thời gian đào tạo</label>
            <input id="f-nganh-dao-tao-duration" name="duration" required defaultValue={editing?.duration} className={input} placeholder="VD: 3 năm" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-nganh-dao-tao-intake" className="mb-1.5 block text-xs font-semibold text-ink-soft">Chỉ tiêu</label>
            <input id="f-nganh-dao-tao-intake" name="intake" type="number" required min={1} defaultValue={editing?.intake} className={input} placeholder="VD: 350" />
          </div>
          <div>
            <label htmlFor="program-tuition" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Học phí <span className="font-normal text-ink-faint">(tuỳ chọn)</span>
            </label>
            <input id="program-tuition" name="tuition" maxLength={80} defaultValue={editing?.tuition ?? ""} className={input} placeholder="VD: 1.840.000đ/tháng" />
            <p className="mt-1.5 text-[11px] text-ink-faint">Để trống thì web hiện &quot;Liên hệ&quot; — chỉ nhập khi trường đã chốt mức chính thức.</p>
          </div>
        </div>
        <div>
          <label htmlFor="f-nganh-dao-tao-image" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Ảnh ngành <span className="font-normal text-ink-faint">(tuỳ chọn — để trống thì thẻ ngành chỉ có khối màu)</span>
          </label>
          <ImagePicker id="f-nganh-dao-tao-image" spec="program" fileFieldName="image" pickedFieldName="imageExisting" images={mediaImages} currentUrl={editing?.imageUrl} />
          {editing?.imageUrl && (
            <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
              <input type="checkbox" name="removeImage" className="h-4 w-4 rounded border-line" /> Gỡ ảnh hiện tại
            </label>
          )}
        </div>
        <div>
          <label htmlFor="f-nganh-dao-tao-summary" className="mb-1.5 block text-xs font-semibold text-ink-soft">Mô tả ngắn</label>
          <textarea
            id="f-nganh-dao-tao-summary"
            name="summary"
            required
            rows={3}
            defaultValue={editing?.summary}
            className={input}
            placeholder="Hiển thị ở thẻ ngành Trang chủ & trang danh sách"
          />
        </div>
        <div>
          <label htmlFor="f-nganh-dao-tao-content" className="mb-1.5 block text-xs font-semibold text-ink-soft">Nội dung chi tiết (tuỳ chọn)</label>
          <MarkdownEditor
            id="f-nganh-dao-tao-content"
            name="content"
            rows={14}
            defaultValue={editing?.content ?? ""}
            placeholder="Hiện ở trang chi tiết ngành — mục tiêu đào tạo, nội dung chương trình, cơ hội nghề nghiệp…"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3 space-y-3">
            <AutoTranslateButton
              pairs={[
                { viName: "name", enName: "nameEn" },
                { viName: "summary", enName: "summaryEn" },
                { viName: "content", enName: "contentEn" },
                { viName: "tuition", enName: "tuitionEn" },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input aria-label="Program name (English)" name="nameEn" defaultValue={editing?.nameEn ?? ""} placeholder="Program name (English)" className={input} />
              <input
                aria-label="Tuition (English), e.g. 1,840,000 VND/month"
                name="tuitionEn"
                defaultValue={editing?.tuitionEn ?? ""}
                placeholder="Tuition (English), e.g. 1,840,000 VND/month"
                className={input}
              />
            </div>
            <textarea aria-label="Short summary (English)" name="summaryEn" rows={3} defaultValue={editing?.summaryEn ?? ""} placeholder="Short summary (English)" className={input} />
            <MarkdownEditor aria-label="Full detail content (English)" name="contentEn" rows={10} defaultValue={editing?.contentEn ?? ""} placeholder="Full detail content (English)" />
          </div>
        </details>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          <input type="checkbox" name="featured" defaultChecked={editing ? editing.featured === 1 : true} className="h-4 w-4 rounded border-line" />
          Hiện ở Trang chủ
        </label>
        <FormActions cancelHref="/admin/nganh-dao-tao" submitLabel={editing ? "Lưu thay đổi" : "Thêm ngành"} />
      </form>
    </AdminFormLayout>
  );
}
