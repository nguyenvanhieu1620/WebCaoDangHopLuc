import { notFound } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertDepartmentAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa khoa-bộ môn — dùng chung cho `them-moi/` và `[id]/`. */
export async function DepartmentFormPage({ id }: { id?: string }) {
  await requirePermission("faculty");
  const editing = id ? await db.query.departments.findFirst({ where: eq(schema.departments.id, id) }) : null;
  if (id && !editing) notFound();
  const [{ total }] = await db.select({ total: count() }).from(schema.departments);

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm khoa/bộ môn"}
      description="Danh mục nhóm giảng viên theo khoa — hiện ở trang /doi-ngu-giang-vien"
      backHref="/admin/khoa"
    >
      <form action={upsertDepartmentAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-khoa-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên khoa/bộ môn</label>
          <input
            id="f-khoa-name"
            name="name"
            required
            defaultValue={editing?.name}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Khoa Điều dưỡng"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "name", enName: "nameEn" }]} />
            <input
              aria-label="Department name (English)"
              name="nameEn"
              defaultValue={editing?.nameEn ?? ""}
              placeholder="Department name (English)"
              className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <div>
          <label htmlFor="f-khoa-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
          <input
            id="f-khoa-sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={editing?.sortOrder ?? total}
            className="w-full max-w-[200px] rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <FormActions cancelHref="/admin/khoa" submitLabel={editing ? "Lưu thay đổi" : "Thêm khoa/bộ môn"} />
      </form>
    </AdminFormLayout>
  );
}
