import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { AdminFormLayout, FormActions } from "@/components/admin/AdminFormLayout";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { upsertNavItemAction } from "./actions";

/**
 * Trang Thêm (không có `id`) / Sửa mục menu — dùng chung cho `them-moi/` và `[id]/`.
 * `parent` (từ `?parent=` của nút "+ Mục con" ở danh sách) chọn sẵn danh mục cha khi thêm mới.
 */
export async function NavItemFormPage({ id, parent }: { id?: string; parent?: string }) {
  await requirePermission("menu");
  const allItems = await db.query.navItems.findMany({ orderBy: [asc(schema.navItems.sortOrder), asc(schema.navItems.seq)] });
  const editing = id ? allItems.find((i) => i.id === id) ?? null : null;
  if (id && !editing) notFound();
  const topLevel = allItems.filter((i) => !i.parentId);
  const defaultParent = editing ? editing.parentId ?? "" : topLevel.some((t) => t.id === parent) ? parent! : "";
  const siblings = allItems.filter((i) => (i.parentId ?? "") === defaultParent).length;

  return (
    <AdminFormLayout
      title={editing ? `Sửa: ${editing.label}` : defaultParent ? "Thêm danh mục con" : "Thêm mục menu"}
      description="Danh mục to/con hiển thị ở menu điều hướng trang công khai"
      backHref="/admin/menu"
    >
      <form action={upsertNavItemAction} className="space-y-5">
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-menu-label" className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên hiển thị</label>
            <input
              id="f-menu-label"
              name="label"
              required
              defaultValue={editing?.label}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="VD: Ngành đào tạo"
            />
          </div>
          <div>
            <label htmlFor="f-menu-href" className="mb-1.5 block text-xs font-semibold text-ink-soft">Đường dẫn</label>
            <input
              id="f-menu-href"
              name="href"
              required
              defaultValue={editing?.href}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              placeholder="VD: /nganh-dao-tao"
            />
          </div>
        </div>
        <div>
          <label htmlFor="nav-description" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Mô tả ngắn <span className="font-normal text-ink-faint">(tuỳ chọn — chỉ hiện ở danh mục con, dưới tên mục trong menu thả xuống)</span>
          </label>
          <input
            id="nav-description"
            name="description"
            maxLength={90}
            defaultValue={editing?.description ?? ""}
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            placeholder="VD: Mã 6720301 · 3 năm"
          />
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ink-soft">🇬🇧 Bản tiếng Anh (tuỳ chọn)</summary>
          <div className="mt-3">
            <AutoTranslateButton
              pairs={[
                { viName: "label", enName: "labelEn" },
                { viName: "description", enName: "descriptionEn" },
              ]}
            />
          </div>
          <input
            aria-label="Label (English)"
            name="labelEn"
            defaultValue={editing?.labelEn ?? ""}
            placeholder="VD: Programs"
            className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <input
            aria-label="Short description (English)"
            name="descriptionEn"
            defaultValue={editing?.descriptionEn ?? ""}
            placeholder="Short description (English)"
            className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </details>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="f-menu-parentId" className="mb-1.5 block text-xs font-semibold text-ink-soft">Danh mục cha</label>
            <select
              id="f-menu-parentId"
              name="parentId"
              defaultValue={defaultParent}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              <option value="">— Không (là danh mục to) —</option>
              {topLevel
                .filter((t) => t.id !== editing?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="f-menu-sortOrder" className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
            <input
              id="f-menu-sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={editing?.sortOrder ?? siblings}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          <input type="checkbox" name="isPrimary" defaultChecked={editing ? editing.isPrimary === 1 : true} className="h-4 w-4 rounded border-line" />
          Hiện ở menu chính (chỉ áp dụng cho danh mục to — bỏ chọn = nằm trong nút ☰)
        </label>
        <FormActions cancelHref="/admin/menu" submitLabel={editing ? "Lưu thay đổi" : "Thêm mục menu"} />
      </form>
    </AdminFormLayout>
  );
}

