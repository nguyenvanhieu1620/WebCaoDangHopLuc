import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { upsertPartnerAction, deletePartnerAction } from "./actions";

export const metadata: Metadata = { title: "Đối tác" };

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const allPartners = await db.query.partners.findMany({
    orderBy: asc(schema.partners.sortOrder),
  });
  const editing = edit
    ? await db.query.partners.findFirst({ where: eq(schema.partners.id, edit) })
    : null;

  return (
    <div>
      <AdminTopbar
        title="Đối tác"
        description="Dải tên đối tác hiển thị ở Trang chủ — vị trí càng nhỏ hiện càng trước"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <span className="text-sm font-semibold text-brand-900">
              Danh sách ({allPartners.length})
            </span>
          </div>
          {allPartners.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-faint">
              Chưa có đối tác nào. Thêm ở form bên phải.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {allPartners.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-ink-faint">#{p.sortOrder}</span>
                    <span className="text-sm font-medium text-ink">{p.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/admin/doi-tac?edit=${p.id}`}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
                    >
                      Sửa
                    </a>
                    <form
                      action={async () => {
                        "use server";
                        await deletePartnerAction(p.id);
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
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-900">
              {editing ? `Sửa: ${editing.name}` : "Thêm đối tác"}
            </span>
            {editing && (
              <a href="/admin/doi-tac" className="text-xs font-semibold text-ink-faint hover:text-ink">
                Huỷ sửa
              </a>
            )}
          </div>
          <form key={editing?.id ?? "new"} action={upsertPartnerAction} className="space-y-3.5">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Tên đối tác</label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                placeholder="VD: Bệnh viện Nhi Thanh Hóa"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Vị trí (số nhỏ hiện trước)</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={editing?.sortOrder ?? allPartners.length}
                className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-accent-600 to-accent-500 py-2.5 text-sm font-bold text-white shadow-red"
            >
              {editing ? "Lưu thay đổi" : "Thêm đối tác"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
