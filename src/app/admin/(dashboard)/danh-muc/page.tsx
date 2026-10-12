import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { AutoTranslateButton } from "@/components/admin/AutoTranslateButton";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertCategoryAction, deleteCategoryAction } from "./actions";
import { requirePermission } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Danh mục bài viết" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requirePermission("posts");
  const { edit } = await searchParams;
  const categories = await db.query.categories.findMany({ orderBy: [asc(schema.categories.name), asc(schema.categories.seq)] });
  const editing = edit
    ? await db.query.categories.findFirst({ where: eq(schema.categories.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Danh mục bài viết"
        description="Dùng để phân loại Bài viết — chọn qua dropdown khi viết bài mới ở mục Bài viết"
      />
      <div className="p-8">
        <div className="max-w-xl rounded-2xl border border-line bg-white p-6">
          <div className="mb-3 text-sm font-semibold text-brand-900">
            Danh sách ({categories.length})
          </div>
          {categories.length > 0 ? (
            <ul className="mb-4 space-y-1.5">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-paper-alt px-3 py-2 text-[13px]"
                >
                  <span className="font-medium text-ink">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`/admin/danh-muc?edit=${c.id}`}
                      className="text-[11px] font-semibold text-brand-700 hover:underline"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deleteCategoryAction(c.id);
                      }}
                    >
                      <ConfirmDeleteButton
                        className="text-[11px] font-semibold text-accent-600 hover:underline"
                        confirmMessage={`Xoá danh mục "${c.name}"? Bài viết đang gắn danh mục này sẽ không còn danh mục.`}
                      >
                        Xoá
                      </ConfirmDeleteButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mb-4 text-[13px] text-ink-faint">Chưa có danh mục nào.</div>
          )}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">
              {editing ? `Sửa: ${editing.name}` : "Thêm danh mục mới"}
            </span>
            {editing && (
              <a href="/admin/danh-muc" className="text-[11px] font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertCategoryAction} className="space-y-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="flex gap-2">
              <input
                name="categoryName"
                required
                defaultValue={editing?.name}
                placeholder="Tên danh mục mới"
                className="flex-1 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white"
              >
                {editing ? "Lưu" : "Thêm"}
              </button>
            </div>
            <input
              name="categoryNameEn"
              defaultValue={editing?.nameEn ?? ""}
              placeholder="Category name (English, tuỳ chọn)"
              className="w-full rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-brand-500"
            />
            <AutoTranslateButton pairs={[{ viName: "categoryName", enName: "categoryNameEn" }]} />
          </form>
        </div>
      </div>
    </div>
  );
}
