import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertNavItemAction, deleteNavItemAction } from "./actions";

export const metadata: Metadata = { title: "Menu chính" };

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const allItems = await db.query.navItems.findMany({
    orderBy: asc(schema.navItems.sortOrder),
  });
  const topLevel = allItems.filter((i) => !i.parentId);
  const childrenOf = (parentId: string) => allItems.filter((i) => i.parentId === parentId);
  const editing = edit ? await db.query.navItems.findFirst({ where: eq(schema.navItems.id, edit) }) : null;

  return (
    <div>
      <AdminTopbar
        title="Menu chính"
        description="Danh mục to/con hiển thị ở menu điều hướng trang công khai"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_400px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh mục to ({topLevel.length})
            </span>
          </div>
          {topLevel.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có mục menu nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {topLevel.map((item) => (
                <li key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{item.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.isPrimary === 1
                              ? "bg-brand-100 text-brand-700"
                              : "bg-paper-alt text-ink-faint"
                          }`}
                        >
                          {item.isPrimary === 1 ? "Menu chính" : "Danh mục khác (☰)"}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
                        {item.href} · vị trí #{item.sortOrder}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={`/admin/menu?edit=${item.id}`}
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                      >
                        Sửa
                      </a>
                      <form
                        action={async () => {
                          "use server";
                          await deleteNavItemAction(item.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-600 hover:border-accent-500"
                        >
                          Xoá
                        </button>
                      </form>
                    </div>
                  </div>
                  {childrenOf(item.id).length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-line pl-4">
                      {childrenOf(item.id).map((child) => (
                        <li key={child.id} className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-ink">{child.label}</div>
                            <div className="font-mono text-[10.5px] text-ink-faint">
                              {child.href} · vị trí #{child.sortOrder}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <a
                              href={`/admin/menu?edit=${child.id}`}
                              className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                            >
                              Sửa
                            </a>
                            <form
                              action={async () => {
                                "use server";
                                await deleteNavItemAction(child.id);
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-accent-600 hover:border-accent-500"
                              >
                                Xoá
                              </button>
                            </form>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.label}` : "Thêm mục menu"}
            </span>
            {editing && (
              <a href="/admin/menu" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertNavItemAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên hiển thị</label>
              <input
                name="label"
                required
                defaultValue={editing?.label}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Ngành đào tạo"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Đường dẫn</label>
              <input
                name="href"
                required
                defaultValue={editing?.href}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: /nganh-dao-tao"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Danh mục cha</label>
              <select
                name="parentId"
                defaultValue={editing?.parentId ?? ""}
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
            <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <input
                type="checkbox"
                name="isPrimary"
                defaultChecked={editing ? editing.isPrimary === 1 : true}
                className="h-4 w-4 rounded border-line"
              />
              Hiện ở menu chính (chỉ áp dụng cho danh mục to — bỏ chọn = nằm trong nút ☰)
            </label>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allItems.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm mục menu"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
