import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertCategoryAction } from "./actions";

/** Trang Thêm (không có `id`) / Sửa danh mục bài viết — dùng chung cho `them-moi/` và `[id]/`. */
export async function CategoryFormPage({ id }: { id?: string }) {
  await requirePermission("posts");
  const editing = id ? await db.query.categories.findFirst({ where: eq(schema.categories.id, id) }) : null;
  if (id && !editing) notFound();

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.name}` : "Thêm danh mục"}
      description="Dùng để phân loại Bài viết — chọn qua ô Danh mục khi viết bài"
      backHref="/admin/danh-muc"
    >
      <form action={upsertCategoryAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div>
          <label htmlFor="f-danh-muc-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên danh mục</label>
          <input
            id="f-danh-muc-name"
            name="categoryName"
            required
            defaultValue={editing?.name}
            placeholder="VD: Tuyển sinh"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          {editing && (
            <p className="mt-1.5 text-[11.5px] text-ink-faint">
              Đổi tên không đổi đường dẫn <code>?category={editing.slug}</code> — link cũ vẫn dùng được.
            </p>
          )}
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Tên tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton pairs={[{ viName: "categoryName", enName: "categoryNameEn" }]} />
            <input
              aria-label="Category name (English)"
              name="categoryNameEn"
              defaultValue={editing?.nameEn ?? ""}
              placeholder="Category name (English)"
              className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </details>
        <FormActions cancelHref="/admin/danh-muc" submitLabel={editing ? "Lưu thay đổi" : "Thêm danh mục"} />
      </form>
    </AdminFormLayout>
  );
}
