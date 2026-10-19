import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertFacultyAttributeAction, type FacultyAttributeType } from "./actions";

export const SECTIONS: { type: FacultyAttributeType; title: string; placeholder: string }[] = [
  { type: "degree", title: "Học vị", placeholder: "VD: ThS.BS" },
  { type: "position", title: "Chức vụ", placeholder: "VD: Trưởng khoa" },
  { type: "academic_rank", title: "Học hàm", placeholder: "VD: PGS" },
];

/** Loại hợp lệ từ `?type=` (sai/thiếu → Học vị). */
export function attributeType(raw: string | undefined): FacultyAttributeType {
  return SECTIONS.some((s) => s.type === raw) ? (raw as FacultyAttributeType) : "degree";
}

const input = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500";

/** Trang Thêm (không có `id`, loại theo `?type=`) / Sửa học hàm-học vị-chức vụ. */
export async function FacultyAttributeFormPage({ id, type }: { id?: string; type?: string }) {
  await requirePermission("faculty");
  const editing = id ? await db.query.facultyAttributes.findFirst({ where: eq(schema.facultyAttributes.id, id) }) : null;
  if (id && !editing) notFound();
  const formType = attributeType(editing?.type ?? type);
  const section = SECTIONS.find((s) => s.type === formType)!;
  const [{ total }] = await db.select({ total: count() }).from(schema.facultyAttributes).where(eq(schema.facultyAttributes.type, formType));
  const backHref = `/admin/danh-hieu?type=${formType}`;

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : `Thêm ${section.title.toLowerCase()}`}
      description="Danh sách dùng chung khi tạo Giảng viên — chọn qua ô thả xuống, tránh gõ tay không đồng nhất"
      backHref={backHref}
    >
      {editing && (
        <div className="mb-5 rounded-xl bg-paper-alt px-4 py-3 text-[12.5px] text-ink-soft">
          Đổi tên ở đây <strong>không tự đổi</strong> các giảng viên đang dùng giá trị cũ — sửa lại từng giảng viên nếu cần.
        </div>
      )}
      <form action={upsertFacultyAttributeAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-danh-hieu-type" className="mb-1.5 block text-xs font-semibold text-ink-soft">Loại</label>
            <select id="f-danh-hieu-type" name="type" defaultValue={formType} className={input}>
              {SECTIONS.map((s) => (
                <option key={s.type} value={s.type}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-danh-hieu-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên</label>
            <input id="f-danh-hieu-name" name="name" required defaultValue={editing?.name} placeholder={section.placeholder} className={input} />
          </div>
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "name", enName: "nameEn" }]} />
            <input aria-label="Name (English)" name="nameEn" defaultValue={editing?.nameEn ?? ""} placeholder="Name (English)" className={`${input} mt-3`} />
          </div>
        </details>
        <div>
          <label htmlFor="f-danh-hieu-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí trong ô chọn (số nhỏ hiện trước)</label>
          <input id="f-danh-hieu-sortOrder" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? total} className={`${input} max-w-[200px]`} />
        </div>
        <FormActions cancelHref={backHref} submitLabel={editing ? "Lưu thay đổi" : `Thêm ${section.title.toLowerCase()}`} />
      </form>
    </AdminFormLayout>
  );
}
